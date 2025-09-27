import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

from .redact import redact_phi

load_dotenv()

# Providers (locked to OpenAI per new architecture)
REAS_PROVIDER = 'openai'
EMBED_PROVIDER = 'openai'

# OpenAI defaults
OPENAI_REAS_MODEL = os.getenv('OPENAI_REAS_MODEL', 'gpt-4o')
OPENAI_EMBED_MODEL = os.getenv('OPENAI_EMBED_MODEL', 'text-embedding-3-large')

# Azure defaults (if needed)
AZURE_OPENAI_ENDPOINT = os.getenv('AZURE_OPENAI_ENDPOINT')
AZURE_OPENAI_KEY = os.getenv('AZURE_OPENAI_KEY')
AZURE_REAS_DEPLOYMENT = os.getenv('AZURE_REAS_DEPLOYMENT', 'gpt-4o')
AZURE_EMBED_DEPLOYMENT = os.getenv('AZURE_EMBED_DEPLOYMENT', 'text-embedding-3-large')

# vLLM local defaults
VLLM_BASE_URL = os.getenv('VLLM_BASE_URL', 'http://localhost:8000/v1')
VLLM_REAS_MODEL = os.getenv('VLLM_REAS_MODEL', 'microsoft/BioGPT-Large')  # example biomed model
VLLM_EMBED_MODEL = os.getenv('VLLM_EMBED_MODEL', 'microsoft/BioGPT-Large')  # assuming embedding support

# Clients
_openai_client = None
_azure_client = None
_vllm_client = None

def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        try:
            from openai import OpenAI
            _openai_client = OpenAI()
        except Exception:
            raise RuntimeError('OpenAI client not configured. Set OPENAI_API_KEY')
    return _openai_client

def _get_azure_client():
    global _azure_client
    if _azure_client is None:
        try:
            from openai import AzureOpenAI
            _azure_client = AzureOpenAI(
                azure_endpoint=AZURE_OPENAI_ENDPOINT,
                api_key=AZURE_OPENAI_KEY,
                api_version="2024-02-01"
            )
        except Exception:
            raise RuntimeError('Azure OpenAI client not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY')
    return _azure_client

def _get_vllm_client():
    global _vllm_client
    if _vllm_client is None:
        try:
            from openai import OpenAI
            _vllm_client = OpenAI(base_url=VLLM_BASE_URL, api_key="not-needed")
        except Exception:
            raise RuntimeError('vLLM client not configured. Ensure vLLM server is running at VLLM_BASE_URL')
    return _vllm_client

def reason(messages: List[Dict[str, str]], model: str = None, **kwargs) -> str:
    """Reasoning LLM call. Returns response content."""
    # Redact PHI from messages
    redacted_messages = []
    for msg in messages:
        redacted_content = redact_phi(msg.get('content', ''))
        redacted_messages.append({'role': msg['role'], 'content': redacted_content})

    provider = REAS_PROVIDER
    # Set default timeout if not provided
    kwargs.setdefault('timeout', 30.0)
    try:
        if provider == 'openai':
            client = _get_openai_client()
            model = model or OPENAI_REAS_MODEL
            resp = client.chat.completions.create(model=model, messages=redacted_messages, **kwargs)
            return resp.choices[0].message.content or ""
        elif provider == 'azure':
            client = _get_azure_client()
            model = model or AZURE_REAS_DEPLOYMENT
            resp = client.chat.completions.create(model=model, messages=redacted_messages, **kwargs)
            return resp.choices[0].message.content or ""
        elif provider == 'vllm_local':
            client = _get_vllm_client()
            model = model or VLLM_REAS_MODEL
            resp = client.chat.completions.create(model=model, messages=redacted_messages, **kwargs)
            return resp.choices[0].message.content or ""
        else:
            raise ValueError(f"Unknown REAS_PROVIDER: {provider}")
    except Exception as e:
        # Log error and return empty for resilience
        print(f"LLM call failed: {e}")
        return ""

def embed_texts(texts: List[str], model: str = None) -> List[List[float]]:
    """Embedding call. Returns list of vectors."""
    provider = EMBED_PROVIDER
    if provider == 'openai':
        client = _get_openai_client()
        model = model or OPENAI_EMBED_MODEL
        resp = client.embeddings.create(model=model, input=texts)
        return [d.embedding for d in resp.data]
    elif provider == 'azure':
        client = _get_azure_client()
        model = model or AZURE_EMBED_DEPLOYMENT
        resp = client.embeddings.create(model=model, input=texts)
        return [d.embedding for d in resp.data]
    elif provider == 'vllm_local':
        client = _get_vllm_client()
        model = model or VLLM_EMBED_MODEL
        resp = client.embeddings.create(model=model, input=texts)
        return [d.embedding for d in resp.data]
    else:
        raise ValueError(f"Unknown EMBED_PROVIDER: {provider}")
