import time
from urllib.parse import urlparse

from django.conf import settings
from pymongo import MongoClient


def mongodb_info(timeout_ms=5000):
    """Ping the configured MongoDB server and describe the connection.

    Returns a dict with 'ok' plus either connection details or 'error'.
    """
    info = {'host': urlparse(settings.MONGODB_URI).hostname, 'database': settings.MONGODB_DB}
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=timeout_ms)
    try:
        start = time.perf_counter()
        client.admin.command('ping')
        info['ping_ms'] = round((time.perf_counter() - start) * 1000)
        info['version'] = client.server_info()['version']
        info['collections'] = len(client[settings.MONGODB_DB].list_collection_names())
        info['ok'] = True
    except Exception as exc:  # pymongo raises several error types here
        info['ok'] = False
        info['error'] = str(exc).split(',')[0]
    finally:
        client.close()
    return info


def ping_mongodb(timeout_ms=5000):
    """Return (ok, message) after pinging the configured MongoDB server."""
    info = mongodb_info(timeout_ms)
    return info['ok'], 'connected' if info['ok'] else info['error']
