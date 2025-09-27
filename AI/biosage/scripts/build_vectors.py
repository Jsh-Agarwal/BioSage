import os
from dotenv import load_dotenv
from biosage.core.vectorstore import build_faiss_index

if __name__ == '__main__':
    load_dotenv()
    print('Building FAISS index from local literature...')
    build_faiss_index()
    print('Done.')
