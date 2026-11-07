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


# ── Rider Duty Status & Nearby Active Riders ─────────────────────────────


async def set_rider_duty_status(
    partner_id: int,
    is_on_duty: bool,
    lat: float = 0.0,
    lng: float = 0.0,
    name: str = "Rider",
) -> None:
    """
    Marks a delivery partner as ON_DUTY / OFF_DUTY in Redis.
    Key: 'rider_duty:{partner_id}' with 8-hour TTL (auto-cleanup if rider forgets to go off-duty).
    """
    if is_on_duty:
        payload = {
            "partner_id": partner_id,
            "name": name,
            "lat": lat,
            "lng": lng,
            "status": "ON_DUTY",
            "updated_at": int(time.time()),
        }
        await set_cached_json(f"rider_duty:{partner_id}", payload, ttl_seconds=28800)  # 8 hours
        # Also add to the active riders set (locality-agnostic global list)
        await _add_to_active_riders_set(partner_id)
    else:
        # Remove from Redis and active set
        await _delete_key(f"rider_duty:{partner_id}")
        await _remove_from_active_riders_set(partner_id)


async def get_rider_duty_status(partner_id: int) -> Optional[Dict[str, Any]]:
    """Fetches a rider's current duty status from Redis."""
    return await get_cached_json(f"rider_duty:{partner_id}")


async def update_rider_duty_gps(partner_id: int, lat: float, lng: float) -> None:
    """
    Updates an on-duty rider's GPS position (separate from order-specific tracking).
    Used for the job radar to find nearest available rider.
    """
    existing = await get_cached_json(f"rider_duty:{partner_id}")
    if existing and existing.get("status") == "ON_DUTY":
        existing["lat"] = lat
        existing["lng"] = lng
        existing["updated_at"] = int(time.time())
        await set_cached_json(f"rider_duty:{partner_id}", existing, ttl_seconds=28800)


async def get_all_active_riders() -> list:
    """
    Returns list of all currently ON_DUTY rider data dicts.
    Falls back to in-memory scan if Redis unavailable.
    """
    client = _get_redis()
    rider_ids: list = []

    if client:
        try:
            raw = await client.get("active_riders_set")
            if raw:
                rider_ids = json.loads(raw)
        except Exception as e:
            logger.warning(f"[REDIS ACTIVE RIDERS WARNING] {e}")

    # Fallback: scan in-memory cache
    if not rider_ids:
        for k in list(_in_memory_cache.keys()):
            if k.startswith("rider_duty:"):
                cached = _in_memory_cache.get(k)
                if cached and time.time() < cached.get("expires_at", 0):
                    pid = k.split(":")[1]
                    rider_ids.append(int(pid))

    # Fetch each rider's data
    results = []
    for pid in rider_ids:
        data = await get_cached_json(f"rider_duty:{pid}")
        if data and data.get("status") == "ON_DUTY":
            results.append(data)
    return results


# ── Internal helpers ─────────────────────────────────────────────────────


async def _add_to_active_riders_set(partner_id: int) -> None:
    """Adds partner_id to the global active riders JSON list in Redis."""
    client = _get_redis()
    if client:
        try:
            raw = await client.get("active_riders_set")
            ids = json.loads(raw) if raw else []
            if partner_id not in ids:
                ids.append(partner_id)
            await client.set("active_riders_set", json.dumps(ids), ex=28800)
            return
        except Exception as e:
            logger.warning(f"[REDIS ACTIVE SET ADD WARNING] {e}")
    # RAM fallback — stored inside _in_memory_cache with special key
    cached = _in_memory_cache.get("active_riders_set", {"val": [], "expires_at": time.time() + 28800})
    ids = cached["val"]
    if partner_id not in ids:
        ids.append(partner_id)
    _in_memory_cache["active_riders_set"] = {"val": ids, "expires_at": time.time() + 28800}


async def _remove_from_active_riders_set(partner_id: int) -> None:
    """Removes partner_id from the global active riders JSON list in Redis."""
    client = _get_redis()
    if client:
        try:
            raw = await client.get("active_riders_set")
            ids = json.loads(raw) if raw else []
            if partner_id in ids:
                ids.remove(partner_id)
            await client.set("active_riders_set", json.dumps(ids), ex=28800)
            return
        except Exception as e:
            logger.warning(f"[REDIS ACTIVE SET REMOVE WARNING] {e}")
    # RAM fallback
    cached = _in_memory_cache.get("active_riders_set", {"val": [], "expires_at": time.time() + 28800})
    ids = cached["val"]
    if partner_id in ids:
        ids.remove(partner_id)
    _in_memory_cache["active_riders_set"] = {"val": ids, "expires_at": time.time() + 28800}


async def _delete_key(key: str) -> None:
    """Deletes a key from Redis and in-memory fallback."""
    client = _get_redis()
    if client:
        try:
            await client.delete(key)
        except Exception as e:
            logger.warning(f"[REDIS DELETE WARNING] {key}: {e}")
    _in_memory_cache.pop(key, None)
