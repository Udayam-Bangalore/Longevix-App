"""Redis-backed session storage for production use."""
import json
import asyncio
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import redis.asyncio as redis

logger = logging.getLogger(__name__)

# Global Redis client instance
_redis_client: Optional[redis.Redis] = None
REDIS_URL = "redis://localhost:6379/0"
SESSION_TTL = 86400  # 24 hours


async def init_redis(url: str = None):
    """Initialize Redis connection."""
    global _redis_client, REDIS_URL
    if url:
        REDIS_URL = url
    try:
        _redis_client = redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            max_connections=20,
            retry_on_timeout=True,
        )
        # Test connection
        await _redis_client.ping()
        logger.info("Redis connection established")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return False


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")


async def get_redis() -> Optional[redis.Redis]:
    """Get Redis client instance."""
    global _redis_client
    if _redis_client is None:
        await init_redis()
    return _redis_client


class SessionStore:
    """Redis-backed session storage."""
    
    SESSION_PREFIX = "session:"
    
    @staticmethod
    async def get(session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data from Redis."""
        try:
            client = await get_redis()
            if client is None:
                return None
            
            key = f"{SessionStore.SESSION_PREFIX}{session_id}"
            data = await client.get(key)
            
            if data:
                session = json.loads(data)
                # Update last accessed time
                session["last_accessed"] = datetime.utcnow().isoformat()
                await client.setex(key, SESSION_TTL, json.dumps(session))
                return session
            return None
        except Exception as e:
            logger.error(f"Error getting session {session_id}: {e}")
            return None
    
    @staticmethod
    async def set(session_id: str, data: Dict[str, Any], ttl: int = None) -> bool:
        """Save session data to Redis."""
        try:
            client = await get_redis()
            if client is None:
                return False
            
            key = f"{SessionStore.SESSION_PREFIX}{session_id}"
            session_data = {
                **data,
                "created_at": data.get("created_at") or datetime.utcnow().isoformat(),
                "last_accessed": datetime.utcnow().isoformat(),
            }
            
            expire_time = ttl if ttl else SESSION_TTL
            await client.setex(key, expire_time, json.dumps(session_data))
            return True
        except Exception as e:
            logger.error(f"Error saving session {session_id}: {e}")
            return False
    
    @staticmethod
    async def delete(session_id: str) -> bool:
        """Delete session from Redis."""
        try:
            client = await get_redis()
            if client is None:
                return False
            
            key = f"{SessionStore.SESSION_PREFIX}{session_id}"
            await client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False
    
    @staticmethod
    async def exists(session_id: str) -> bool:
        """Check if session exists."""
        try:
            client = await get_redis()
            if client is None:
                return False
            
            key = f"{SessionStore.SESSION_PREFIX}{session_id}"
            return await client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking session {session_id}: {e}")
            return False
    
    @staticmethod
    async def clear_all(pattern: str = None) -> int:
        """Clear all sessions (use with caution)."""
        try:
            client = await get_redis()
            if client is None:
                return 0
            
            key_pattern = f"{SessionStore.SESSION_PREFIX}{pattern or '*'}"
            keys = await client.keys(key_pattern)
            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Error clearing sessions: {e}")
            return 0
    
    @staticmethod
    async def get_stats() -> Dict[str, Any]:
        """Get session store statistics."""
        try:
            client = await get_redis()
            if client is None:
                return {"status": "disconnected", "session_count": 0}
            
            keys = await client.keys(f"{SessionStore.SESSION_PREFIX}*")
            info = await client.info("memory")
            
            return {
                "status": "connected",
                "session_count": len(keys),
                "used_memory_human": info.get("used_memory_human", "unknown"),
                "connected_clients": info.get("connected_clients", 0),
            }
        except Exception as e:
            logger.error(f"Error getting session stats: {e}")
            return {"status": "error", "error": str(e)}


# Fallback in-memory storage for development
class InMemorySessionStore:
    """In-memory fallback for development."""
    
    _sessions: Dict[str, Dict[str, Any]] = {}
    _lock = asyncio.Lock()
    
    @staticmethod
    async def get(session_id: str) -> Optional[Dict[str, Any]]:
        async with InMemorySessionStore._lock:
            return InMemorySessionStore._sessions.get(session_id)
    
    @staticmethod
    async def set(session_id: str, data: Dict[str, Any], ttl: int = None) -> bool:
        async with InMemorySessionStore._lock:
            InMemorySessionStore._sessions[session_id] = data
            return True
    
    @staticmethod
    async def delete(session_id: str) -> bool:
        async with InMemorySessionStore._lock:
            if session_id in InMemorySessionStore._sessions:
                del InMemorySessionStore._sessions[session_id]
                return True
            return False
    
    @staticmethod
    async def exists(session_id: str) -> bool:
        return session_id in InMemorySessionStore._sessions
    
    @staticmethod
    async def get_stats() -> Dict[str, Any]:
        return {
            "status": "in_memory",
            "session_count": len(InMemorySessionStore._sessions),
        }


# Use Redis in production, memory in development
_use_redis = False


async def get_session_store() -> 'SessionStore | InMemorySessionStore':
    """Get the appropriate session store based on configuration."""
    global _use_redis
    if not _use_redis:
        return InMemorySessionStore()
    
    # Try to initialize Redis
    if await init_redis():
        _use_redis = True
        return SessionStore()
    else:
        logger.warning("Redis unavailable, falling back to in-memory storage")
        return InMemorySessionStore()


def use_redis_session(enabled: bool = True):
    """Enable or disable Redis sessions."""
    global _use_redis
    _use_redis = enabled
