import os
import sqlite3
import hashlib
from typing import Dict, Any, List, Optional
import json
import datetime

# Optional MongoDB support (enabled via env var MONGO_URI)
MONGO_URI = os.getenv('MONGO_URI') or os.getenv('MONGODB_URI')
MONGO_DB = os.getenv('MONGO_DB', 'biosage')
MONGO_COLL = os.getenv('MONGO_COLLECTION', 'AIcases')
MONGO_CASES_COLL_NAME = os.getenv('MONGO_CASES_COLLECTION', 'cases')
MONGO_RESULTS_URI = os.getenv('MONGO_RESULTS_URI') or MONGO_URI
MONGO_RESULTS_DB = os.getenv('MONGO_RESULTS_DB') or MONGO_DB
MONGO_RESULTS_COLL_NAME = os.getenv('MONGO_RESULTS_COLLECTION', 'diagnosed_results')
_mongo_client = None
_mongo_coll = None
_mongo_cases_coll = None
_mongo_results_client = None
_mongo_results_coll = None
if MONGO_URI:
    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        _mongo_client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
        _mongo_db = _mongo_client[MONGO_DB]
        _mongo_coll = _mongo_db[MONGO_COLL]
        _mongo_cases_coll = _mongo_db[MONGO_CASES_COLL_NAME]
        # lightweight ping
        _mongo_client.admin.command('ping')
    except Exception:
        _mongo_client = None
        _mongo_coll = None
        _mongo_cases_coll = None

if MONGO_RESULTS_URI:
    try:
        from pymongo import MongoClient as _RClient
        from pymongo.server_api import ServerApi as _RServerApi
        _mongo_results_client = _RClient(MONGO_RESULTS_URI, server_api=_RServerApi('1'))
        _mongo_results_db = _mongo_results_client[MONGO_RESULTS_DB]
        _mongo_results_coll = _mongo_results_db[MONGO_RESULTS_COLL_NAME]
        _mongo_results_client.admin.command('ping')
    except Exception:
        _mongo_results_client = None
        _mongo_results_coll = None

ROOT = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(ROOT, 'storage', 'app.db')

SCHEMA_SQL = '''
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  intake TEXT,
  normalized TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS agent_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  output TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id)
);
CREATE TABLE IF NOT EXISTS integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  fused_output TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id)
);
CREATE TABLE IF NOT EXISTS evidence_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  content TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id)
);
'''

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA foreign_keys = ON;')
    return conn

def init_db():
    with get_conn() as c:
        c.executescript(SCHEMA_SQL)

class EvidenceStore:
    def __init__(self):
        init_db()

    def put(self, case_id: str, data: Dict[str, Any]):
        hashed_id = hashlib.sha256(case_id.encode()).hexdigest()
        with get_conn() as c:
            c.execute('INSERT OR REPLACE INTO cases(id, intake, normalized) VALUES(?,?,?)',
                      (hashed_id, json.dumps(data.get('intake', {})), json.dumps(data.get('normalized', {}))))
            for agent, output in data.get('agents', {}).items():
                c.execute('INSERT INTO agent_outputs(case_id, agent, output) VALUES(?,?,?)',
                          (hashed_id, agent, json.dumps(output)))
            c.execute('INSERT INTO integrations(case_id, fused_output) VALUES(?,?)',
                      (hashed_id, json.dumps(data.get('fused', {}))))
            for item in data.get('evidence', []):
                c.execute('INSERT INTO evidence_items(case_id, item_type, content) VALUES(?,?,?)',
                          (hashed_id, item.get('type', 'misc'), json.dumps(item)))
            c.commit()

        # Mirror to MongoDB (best-effort, non-fatal)
        if _mongo_coll is not None:
            try:
                doc = {
                    '_id': hashed_id,
                    'case_id_hash': hashed_id,
                    'original_case_id': case_id,  # caution: may contain PHI; set MONGO_STORE_ORIGINAL_ID=false to omit
                    'intake': data.get('intake', {}),
                    'normalized': data.get('normalized', {}),
                    'agents': data.get('agents', {}),
                    'fused': data.get('fused', {}),
                    'evidence': data.get('evidence', []),
                    'created_at': datetime.datetime.utcnow(),
                }
                if os.getenv('MONGO_STORE_ORIGINAL_ID', 'true').lower() not in ('1', 'true', 'yes'):
                    doc.pop('original_case_id', None)
                _mongo_coll.replace_one({'_id': hashed_id}, doc, upsert=True)
            except Exception:
                pass

    def get(self, case_id: str) -> Dict[str, Any]:
        hashed_id = hashlib.sha256(case_id.encode()).hexdigest()
        with get_conn() as c:
            case_row = c.execute('SELECT intake, normalized FROM cases WHERE id=?', (hashed_id,)).fetchone()
            if not case_row:
                # Try MongoDB fallback if configured
                if _mongo_coll is not None:
                    try:
                        mdoc = _mongo_coll.find_one({'_id': hashed_id})
                        if mdoc:
                            return {
                                'intake': mdoc.get('intake', {}),
                                'normalized': mdoc.get('normalized', {}),
                                'agents': mdoc.get('agents', {}),
                                'fused': mdoc.get('fused', {}),
                                'evidence': mdoc.get('evidence', []),
                            }
                    except Exception:
                        pass
                return {}
            agents = {}
            for row in c.execute('SELECT agent, output FROM agent_outputs WHERE case_id=?', (hashed_id,)):
                agents[row[0]] = json.loads(row[1])
            fused_row = c.execute('SELECT fused_output FROM integrations WHERE case_id=?', (hashed_id,)).fetchone()
            fused = json.loads(fused_row[0]) if fused_row else {}
            evidence = [json.loads(row[2]) for row in c.execute('SELECT content FROM evidence_items WHERE case_id=?', (hashed_id,))]
            return {
                'intake': json.loads(case_row[0]),
                'normalized': json.loads(case_row[1]),
                'agents': agents,
                'fused': fused,
                'evidence': evidence
            }

    def put_result(self, case_id: str, result: Dict[str, Any]) -> None:
        """Store the exact response payload for a case in the results collection (Mongo only)."""
        if _mongo_results_coll is None:
            return
        try:
            hashed_id = hashlib.sha256(case_id.encode()).hexdigest()
            doc = {
                '_id': hashed_id,
                'case_id_hash': hashed_id,
                'original_case_id': case_id,
                'result': result,
                'created_at': datetime.datetime.utcnow(),
            }
            if os.getenv('MONGO_STORE_ORIGINAL_ID', 'true').lower() not in ('1', 'true', 'yes'):
                doc.pop('original_case_id', None)
            _mongo_results_coll.replace_one({'_id': hashed_id}, doc, upsert=True)
        except Exception:
            # best-effort only
            pass

    # -------- Mongo helpers for API endpoints --------
    def mark_case_diagnosed(self, patient_id: Optional[str] = None, case_id: Optional[str] = None) -> None:
        """Mark a case as diagnosed=true in the Mongo 'cases' collection (best-effort).

        Matches by patient_id and/or case_id if provided.
        """
        if _mongo_cases_coll is None:
            return
        try:
            filters = []
            if patient_id:
                filters.append({'patient_id': patient_id})
            if case_id:
                filters.append({'case_id': case_id})
            if not filters:
                return
            query = {'$or': filters} if len(filters) > 1 else filters[0]
            _mongo_cases_coll.update_one(query, {'$set': {'diagnosed': True}}, upsert=False)
        except Exception:
            pass

    def get_case_doc(self, patient_or_case_id: str) -> Dict[str, Any]:
        """Fetch the raw case document from Mongo 'cases' by patient_id or case_id. Returns {} if not found."""
        if _mongo_cases_coll is None:
            return {}
        try:
            doc = _mongo_cases_coll.find_one({'$or': [
                {'patient_id': patient_or_case_id},
                {'case_id': patient_or_case_id},
            ]}) or {}
            # Ensure datetime fields are JSON-safe
            if doc.get('created_at') and isinstance(doc['created_at'], datetime.datetime):
                doc['created_at'] = doc['created_at'].isoformat()
            if doc.get('diagnosed_at') and isinstance(doc['diagnosed_at'], datetime.datetime):
                doc['diagnosed_at'] = doc['diagnosed_at'].isoformat()
            if doc.get('last_update') and isinstance(doc['last_update'], datetime.datetime):
                doc['last_update'] = doc['last_update'].isoformat()
            return doc
        except Exception:
            return {}

    def get_result(self, case_id: str) -> Dict[str, Any]:
        """Fetch the stored diagnosed result payload for a case from Mongo. Returns {} if not found."""
        if _mongo_results_coll is None:
            return {}
        try:
            hashed_id = hashlib.sha256(case_id.encode()).hexdigest()
            doc = _mongo_results_coll.find_one({'_id': hashed_id})
            if not doc:
                return {}
            # We return only the 'result' payload that was previously stored
            result_payload = doc.get('result') or {}
            return result_payload
        except Exception:
            return {}

EVIDENCE = EvidenceStore()
