import os
import time
from .config import settings
from .logger import log

os.environ["OLLAMA_HOST"] = settings.OLLAMA_HOST


def _get_client(timeout=None):
    """Constrói o Client Ollama com host normalizado. Centraliza para evitar
    duplicação entre query_ollama / query_ollama_stream / warm_up_ollama."""
    from ollama import Client
    host = settings.OLLAMA_HOST
    if not host.startswith("http"):
        host = f"http://{host}"
    return Client(host=host, timeout=timeout or 120)


def query_ollama(messages, format=None, temperature=0.7, timeout=None):
    """Centraliza chamadas ao Ollama para tratamento de erro e config.

    timeout: segundos antes de desistir. None = 120s (default robusto).
    Classificação/extração devem passar um timeout curto (settings.TIMEOUT_API).
    keep_alive mantém o modelo residente na VRAM (settings.OLLAMA_KEEP_ALIVE).
    """
    try:
        client = _get_client(timeout)
        response = client.chat(
            model=settings.OLLAMA_MODEL,
            messages=messages,
            format=format,
            options={'temperature': temperature},
            keep_alive=settings.OLLAMA_KEEP_ALIVE
        )
        return response['message']['content']
    except Exception as e:
        log.error(f"Erro na comunicação com Ollama: {e}")
        return None


def query_ollama_stream(messages, temperature=0.7, timeout=None):
    """Centraliza chamadas streaming ao Ollama."""
    try:
        client = _get_client(timeout)
        response = client.chat(
            model=settings.OLLAMA_MODEL,
            messages=messages,
            options={'temperature': temperature},
            keep_alive=settings.OLLAMA_KEEP_ALIVE,
            stream=True
        )
        for chunk in response:
            yield chunk['message']['content']
    except Exception as e:
        log.error(f"Erro na comunicação streaming com Ollama: {e}")
        yield "Erro de processamento neural."


def warm_up_ollama():
    """Pré-carrega o modelo na VRAM no boot (esconde a lentidão da 1ª inferência).
    Combinado com keep_alive=-1, o modelo permanece residente. Engole exceções —
    se o Ollama ainda não subiu, o sistema segue normal e carrega sob demanda."""
    start = time.time()
    log.info(f"🔥 Aquecendo modelo '{settings.OLLAMA_MODEL}' na VRAM...")
    try:
        client = _get_client(timeout=120)
        client.chat(
            model=settings.OLLAMA_MODEL,
            messages=[{'role': 'user', 'content': 'ping'}],
            options={'temperature': 0},
            keep_alive=settings.OLLAMA_KEEP_ALIVE
        )
        log.info(f"✅ Modelo aquecido e residente ({time.time() - start:.1f}s)")
    except Exception as e:
        log.warning(f"⚠️ Falha no warm-up do Ollama (carregará sob demanda): {e}")
