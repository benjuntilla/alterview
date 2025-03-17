from fastapi import Security, HTTPException, status
from fastapi.security import APIKeyHeader
from src.config import settings

api_key_header = APIKeyHeader(name="Authorization", auto_error=True)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if not api_key_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    
    api_key = api_key_header.replace("Bearer ", "")
    if api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    
    return api_key 