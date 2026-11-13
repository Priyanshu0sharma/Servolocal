import logging
from typing import Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class UpstashRedisClient:
    """
    Lightweight Upstash Redis REST Client.
    Provides sub-5ms caching without requiring external binary drivers.
    """

    def __init__(self):
        self.base_url = (settings.UPSTASH_REDIS_REST_URL or "").rstrip("/")
        self.token = settings.UPSTASH_REDIS_REST_TOKEN or ""
        self.is_configured = bool(self.base_url and self.token)

    async def get(self, key: str) -> Optional[str]:
        """Fetch cached value by key."""
        if not self.is_configured:
            return None
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    f"{self.base_url}/get/{key}",
                    headers={"Authorization": f"Bearer {self.token}"},
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("result")
        except Exception as e:
            logger.warning(f"Upstash Redis GET error for key '{key}': {e}")
        return None

    async def set(self, key: str, value: str, expire_seconds: int = 300) -> bool:
        """Store key-value with TTL in seconds."""
        if not self.is_configured:
            return False
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{self.base_url}/set/{key}/{value}?ex={expire_seconds}",
                    headers={"Authorization": f"Bearer {self.token}"},
                )
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"Upstash Redis SET error for key '{key}': {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.is_configured:
            return False
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(
                    f"{self.base_url}/del/{key}",
                    headers={"Authorization": f"Bearer {self.token}"},
                )
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"Upstash Redis DEL error for key '{key}': {e}")
            return False


redis_client = UpstashRedisClient()

