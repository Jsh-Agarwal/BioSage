import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

from .llm import embed_texts as _embed_texts

OPENAI_EMBED_MODEL = os.getenv('OPENAI_EMBED_MODEL', 'text-embedding-3-large')

def embed_texts(texts: List[str]) -> List[List[float]]:
    return _embed_texts(texts)
