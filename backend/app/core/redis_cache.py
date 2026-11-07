import json
import time
import logging
from typing import Optional, Any, Dict
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("redis_cache")

# Shared Redis async client instance
_redis_client: Optional[aioredis.Redis] = None
# In-memory RAM fallback for zero-downtime resilience
_in_memory_cache: Dict[str, Dict[str, Any]] = {}


def _get_redis() -> Optional[aioredis.Redis]:
    """Returns singleton async Redis client if REDIS_URL is configured."""
    global _redis_client
    if _redis_client is None and settings.REDIS_URL:
        try:
            _redis_client = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2.0,
                socket_timeout=2.0,
            )
        except Exception as e:
            logger.warning(f"[REDIS CONNECTION WARNING] {e}. Using RAM fallback.")
            _redis_client = None
    return _redis_client


async def get_cached_json(key: str) -> Optional[Any]:
    """
    Retrieves and parses cached JSON from Upstash Redis or local RAM fallback.
    Prevents database hammering on heavy traffic spikes.
    """
    client = _get_redis()
    if client:
        try:
            val = await client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"[REDIS GET WARNING] {key}: {e}")

    # Fallback to local memory cache
    cached = _in_memory_cache.get(key)
    if cached:
        if time.time() < cached["expires_at"]:
            return cached["val"]
        _in_memory_cache.pop(key, None)

    return None


async def set_cached_json(key: str, data: Any, ttl_seconds: int = 30) -> None:
    """
    Stores JSON serializable data in Upstash Redis (with TTL).
    Falls back to RAM if Redis is temporarily unreachable.
    """
    val_str = json.dumps(data)
    client = _get_redis()

    if client:
        try:
            await client.set(key, val_str, ex=ttl_seconds)
            return
        except Exception as e:
            logger.warning(f"[REDIS SET WARNING] {key}: {e}")

    # Fallback to local memory cache
    _in_memory_cache[key] = {
        "val": data,
        "expires_at": time.time() + ttl_seconds,
    }


async def update_rider_gps(
    order_id: int,
    partner_id: int,
    lat: float,
    lng: float,
    heading: float = 0.0,
) -> None:
    """
    Updates live 5-second GPS coordinates of delivery partner for an order.
    Stored under 'rider_gps:{order_id}' with 3600 seconds (1 hour) TTL.
    """
    payload = {
        "order_id": order_id,
        "partner_id": partner_id,
        "lat": lat,
        "lng": lng,
        "heading": heading,
        "updated_at": int(time.time()),
    }
    key = f"rider_gps:{order_id}"
    await set_cached_json(key, payload, ttl_seconds=3600)


async def get_rider_gps(order_id: int) -> Optional[Dict[str, Any]]:
    """
    Fetches the latest live delivery partner GPS position for real-time Leaflet map tracking.
    """
    key = f"rider_gps:{order_id}"
    return await get_cached_json(key)
