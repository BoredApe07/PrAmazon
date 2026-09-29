import json
import logging
from typing import Any, Optional
import redis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize connection pool for Upstash Redis
# We use decode_responses=True so values are returned as Python strings (not raw bytes)
# ssl_cert_reqs=None accommodates Windows OpenSSL root CA validation for cloud TLS
_redis_client: Optional[redis.Redis] = None # type: ignore

if settings.REDIS_URL:
    try:
        _redis_client = redis.from_url( # type: ignore
            settings.REDIS_URL,
            decode_responses=True,
            ssl_cert_reqs=None,
            socket_timeout=2.0,          # Never hang requests if Redis has network lag
            socket_connect_timeout=2.0
        )
        # Test connection once at startup
        _redis_client.ping() # type: ignore
        logger.info("Successfully connected to Upstash Redis.")
    except Exception as exc:
        logger.warning(
            f"Failed to connect to Redis at startup: {exc}. "
            "Application will operate in cache-bypass mode (direct DB queries only)."
        )
        _redis_client = None


def get_redis_client() -> Optional[redis.Redis]: # type: ignore
    """Return the active Redis client instance, or None if unavailable."""
    return _redis_client


def get_cache(key: str) -> Optional[Any]:
    """
    Retrieve and deserialize a JSON-encoded value from Redis.
    Gracefully falls back to None on connection errors or cache misses.
    """
    if not _redis_client:
        return None

    try:
        raw_val = _redis_client.get(key)
        if raw_val is not None:
            return json.loads(raw_val)
        return None
    except Exception as exc:
        logger.warning(f"Redis GET failed for key '{key}': {exc}. Falling back to DB.")
        return None


def set_cache(key: str, value: Any, ttl_seconds: int = 60) -> bool:
    """
    Serialize and store a Python dict/list in Redis with a Time-To-Live (TTL).
    Defaults to 60 seconds. Returns True on success, False on error.
    """
    if not _redis_client:
        return False

    try:
        json_str = json.dumps(value)
        _redis_client.setex(key, ttl_seconds, json_str)
        return True
    except Exception as exc:
        logger.warning(f"Redis SET failed for key '{key}': {exc}.")
        return False


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Delete all keys matching a specific glob pattern (e.g. 'products:*').
    Used when data is mutated (e.g. new product added by admin).
    Returns the count of deleted keys.
    """
    if not _redis_client:
        return 0

    try:
        keys_to_delete = list(_redis_client.scan_iter(match=pattern))
        if keys_to_delete:
            deleted_count = _redis_client.delete(*keys_to_delete)
            logger.info(f"Invalidated {deleted_count} cache keys matching pattern '{pattern}'.")
            return deleted_count
        return 0
    except Exception as exc:
        logger.warning(f"Redis cache invalidation failed for pattern '{pattern}': {exc}.")
        return 0
