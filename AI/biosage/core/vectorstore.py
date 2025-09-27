import os
import json
from typing import List, Dict, Any, Tuple
import numpy as np

try:
    import faiss  # type: ignore
except Exception:
    faiss = None

from rank_bm25 import BM25Okapi
from .embeddings import embed_texts

ROOT = os.path.dirname(os.path.dirname(__file__))
LIT_DIR = os.path.join(ROOT, 'data', 'literature')
LIT_PATH = os.path.join(LIT_DIR, 'corpus.jsonl')
VEC_DIR = os.path.join(ROOT, 'storage', 'vector')
INDEX_FILE = os.path.join(VEC_DIR, 'faiss.index')
META_FILE = os.path.join(VEC_DIR, 'meta.jsonl')

# Cache for search results
_search_cache: Dict[str, List[Dict[str, Any]]] = {}


def load_corpus_chunks() -> Tuple[List[str], List[Dict[str, Any]]]:
    texts: List[str] = []
    meta: List[Dict[str, Any]] = []
    seen_ids = set()
    files: List[str] = []
    if os.path.isdir(LIT_DIR):
        for name in sorted(os.listdir(LIT_DIR)):
            if name.endswith('.jsonl'):
                files.append(os.path.join(LIT_DIR, name))
    elif os.path.exists(LIT_PATH):
        files.append(LIT_PATH)
    for path in files:
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for raw_line in f:
                    line = raw_line.strip()
                    if not line:
                        continue
                    try:
                        rec = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    text_value = rec.get('text')
                    doc_id_value = rec.get('doc_id')
                    if not isinstance(text_value, str) or doc_id_value is None:
                        continue
                    if doc_id_value in seen_ids:
                        continue
                    seen_ids.add(doc_id_value)
                    texts.append(text_value)
                    meta.append({
                        'doc_id': doc_id_value,
                        'title': rec.get('title', ''),
                        'year': rec.get('year'),
                        'tags': rec.get('tags', [])
                    })
        except Exception:
            continue
    return texts, meta


# Load corpus for BM25 (after function definition)
_texts, _metas = load_corpus_chunks()
_tokenized_corpus = [t.split() for t in _texts]  # naive tokenization
_bm25 = BM25Okapi(_tokenized_corpus) if _texts else None


def build_faiss_index():
    if faiss is None:
        raise RuntimeError('faiss-cpu not installed')
    os.makedirs(VEC_DIR, exist_ok=True)
    texts, meta = load_corpus_chunks()
    if not texts:
        raise RuntimeError('No literature found at data/literature/corpus.jsonl')
    vecs = embed_texts(texts)
    mat = np.array(vecs).astype('float32')
    index = faiss.IndexFlatIP(mat.shape[1])
    # normalize for cosine via dot
    faiss.normalize_L2(mat)
    index.add(mat)
    faiss.write_index(index, INDEX_FILE)
    with open(META_FILE, 'w', encoding='utf-8') as f:
        for m in meta:
            f.write(json.dumps(m) + '\n')


def load_index():
    if faiss is None:
        raise RuntimeError('faiss-cpu not installed')
    if not os.path.exists(INDEX_FILE):
        raise RuntimeError('Vector index not built')
    index = faiss.read_index(INDEX_FILE)
    return index


def _load_meta_only() -> List[Dict[str, Any]]:
    if not os.path.exists(META_FILE):
        return []
    items: List[Dict[str, Any]] = []
    with open(META_FILE, 'r', encoding='utf-8') as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line:
                continue
            try:
                items.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return items


def search(query: str, k: int = 8) -> List[Dict[str, Any]]:
    """Return top-k passages with metadata and text: [{doc_id,title,year,tags,score,text}]"""
    if faiss is None:
        raise RuntimeError('faiss-cpu not installed')
    index = load_index()
    # load full corpus to map indices -> text/meta (same order used at build time)
    texts, metas = load_corpus_chunks()
    if not texts:
        return []
    qv = np.array(embed_texts([query])[0], dtype='float32')[None, :]
    faiss.normalize_L2(qv)
    D, I = index.search(qv, min(k, len(metas)))
    out: List[Dict[str, Any]] = []
    for score, idx in zip(D[0].tolist(), I[0].tolist()):
        if idx == -1:
            continue
        m = dict(metas[idx])
        m['score'] = float(score)
        # include a short excerpt of the text
        txt = texts[idx]
        m['text'] = txt if len(txt) <= 800 else (txt[:800] + '...')
        out.append(m)
    return out


def bm25_search(query: str, k: int = 10) -> List[Dict[str, Any]]:
    if _bm25 is None:
        return []
    query_tokens = query.split()
    scores = _bm25.get_scores(query_tokens)
    top_indices = np.argsort(scores)[::-1][:k]
    results = []
    for idx in top_indices:
        if scores[idx] > 0:
            m = dict(_metas[idx])
            m['score'] = float(scores[idx])
            m['text'] = _texts[idx][:800] + '...' if len(_texts[idx]) > 800 else _texts[idx]
            results.append(m)
    return results

def hybrid_search(query: str, k_dense: int = 8, k_sparse: int = 8, k_final: int = 8) -> List[Dict[str, Any]]:
    # Dense retrieval
    dense_results = search(query, k_dense)
    # Sparse retrieval
    sparse_results = bm25_search(query, k_sparse)
    # Combine and dedupe by doc_id
    combined = {}
    for r in dense_results + sparse_results:
        doc_id = r['doc_id']
        if doc_id not in combined or r['score'] > combined[doc_id]['score']:
            combined[doc_id] = r
    # Simple re-rank: sort by score (dense + sparse blended)
    sorted_results = sorted(combined.values(), key=lambda x: x['score'], reverse=True)[:k_final]
    return sorted_results

def search_hybrid(query: str, k_dense: int = 8, k_sparse: int = 8, k_final: int = 8) -> List[Dict[str, Any]]:
    cache_key = f"{query}_{k_dense}_{k_sparse}_{k_final}"
    if cache_key in _search_cache:
        return _search_cache[cache_key]
    result = hybrid_search(query, k_dense, k_sparse, k_final)
    _search_cache[cache_key] = result
    return result
