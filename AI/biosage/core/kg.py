import os
import sqlite3
from typing import List, Tuple, Dict, Any, Optional
import networkx as nx
import numpy as np

ROOT = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(ROOT, 'storage', 'kg.db')
GRAPHML_PATH = os.path.join(ROOT, 'storage', 'kg.graphml')

SCHEMA_SQL = '''
CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  src INTEGER NOT NULL,
  rel TEXT NOT NULL,
  dst INTEGER NOT NULL,
  source_doc TEXT,
  weight REAL DEFAULT 1.0,
  FOREIGN KEY(src) REFERENCES entities(id),
  FOREIGN KEY(dst) REFERENCES entities(id)
);
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sensitivity REAL NOT NULL,
  specificity REAL NOT NULL,
  cost REAL DEFAULT 1.0,
  risk REAL DEFAULT 1.0
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


def upsert_entity(c, name: str, typ: str) -> int:
    cur = c.execute('SELECT id FROM entities WHERE name=? AND type=?', (name, typ))
    row = cur.fetchone()
    if row:
        return row[0]
    cur = c.execute('INSERT INTO entities(name, type) VALUES(?,?)', (name, typ))
    return cur.lastrowid


def add_relation(c, src_id: int, rel: str, dst_id: int, source_doc: Optional[str] = None, weight: float = 1.0):
    c.execute('INSERT INTO relations(src, rel, dst, source_doc, weight) VALUES(?,?,?,?,?)',
              (src_id, rel, dst_id, source_doc, weight))


def to_networkx() -> nx.MultiDiGraph:
    init_db()
    with get_conn() as c:
        G = nx.MultiDiGraph()
        for (eid, name, typ) in c.execute('SELECT id,name,type FROM entities'):
            G.add_node(eid, name=name, type=typ)
        for (src, rel, dst, source_doc, weight) in c.execute('SELECT src,rel,dst,source_doc,weight FROM relations'):
            G.add_edge(src, dst, rel=rel, source_doc=source_doc, weight=weight)
    try:
        nx.write_graphml(G, GRAPHML_PATH)
    except Exception:
        pass
    return G


def paths_between(G: nx.Graph, a_name: str, b_name: str, max_hops: int = 3) -> List[List[str]]:
    a_nodes = [n for n, d in G.nodes(data=True) if d.get('name') == a_name]
    b_nodes = [n for n, d in G.nodes(data=True) if d.get('name') == b_name]
    paths: List[List[str]] = []
    for a in a_nodes:
        for b in b_nodes:
            try:
                for path in nx.all_simple_paths(G, a, b, cutoff=max_hops):
                    paths.append([G.nodes[n]['name'] for n in path])
            except nx.NetworkXNoPath:
                continue
    return paths


def suggest_next_best_test(G: nx.Graph, hypotheses: List[str], observed: List[str]) -> Tuple[str, str, List[List[str]], List[str]]:
    # Information gain heuristic: maximize expected entropy reduction
    init_db()
    with get_conn() as c:
        test_priors = {row[0]: {'sens': row[1], 'spec': row[2], 'cost': row[3], 'risk': row[4]} for row in c.execute('SELECT name, sensitivity, specificity, cost, risk FROM tests')}
    
    if not test_priors:
        # Fallback to vote-count
        test_votes: Dict[str, int] = {}
        edges: List[List[str]] = []
        for n, d in G.nodes(data=True):
            if d.get('type') == 'Test':
                test_votes[d['name']] = 0
        for u, v, edata in G.edges(data=True):
            if edata.get('rel') == 'suggests_test':
                src_name = G.nodes[u]['name']
                dst_name = G.nodes[v]['name']
                if src_name in hypotheses:
                    test_votes[dst_name] = test_votes.get(dst_name, 0) + 1
                    edges.append([src_name, 'suggests_test', dst_name])
        if not test_votes:
            return 'Clinical re-evaluation', 'Insufficient KG suggestions', [], []
        best = max(test_votes.items(), key=lambda x: x[1])[0]
        linked = sorted({e[0] for e in edges if e[2] == best})
        best_edges = [e for e in edges if e[2] == best]
        why = f"Separates top hypotheses ({', '.join(linked)})"
        return best, why, best_edges, linked
    
    # IG calculation
    hyp_probs = {h: 1.0 / len(hypotheses) for h in hypotheses}  # uniform prior
    ig_scores = {}
    for test_name, priors in test_priors.items():
        sens, spec = priors['sens'], priors['spec']
        expected_h = 0.0
        for outcome in ['positive', 'negative']:
            p_outcome = sum(hyp_probs[h] * (sens if outcome == 'positive' else (1 - sens)) for h in hypotheses)
            if p_outcome > 0:
                h_cond = -sum(hyp_probs[h] * np.log(hyp_probs[h]) for h in hypotheses if hyp_probs[h] > 0)
                expected_h += p_outcome * h_cond
        ig_scores[test_name] = -expected_h  # negative entropy reduction
    
    if not ig_scores:
        return 'Clinical re-evaluation', 'No IG calculable', [], []
    best = max(ig_scores.items(), key=lambda x: x[1])[0]
    linked = hypotheses  # all linked via IG
    edges = [[h, 'suggests_test', best] for h in hypotheses]
    why = f"Maximizes information gain for top hypotheses"
    return best, why, edges, linked


def add_test_prior(c, name: str, sensitivity: float, specificity: float, cost: float = 1.0, risk: float = 1.0):
    c.execute('INSERT OR REPLACE INTO tests(name, sensitivity, specificity, cost, risk) VALUES(?,?,?,?,?)',
              (name, sensitivity, specificity, cost, risk))
