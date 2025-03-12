from typing import Annotated, AsyncGenerator

from fastapi import Depends, HTTPException
from supabase._async.client import AsyncClient, create_client
from supabase.lib.client_options import AsyncClientOptions as ClientOptions

from src.config import settings


async def get_db() -> AsyncGenerator[AsyncClient, None]:
    client: AsyncClient | None = None
    try:
        client = await create_client(
            settings.DB_URL,
            settings.DB_API_KEY,
            options=ClientOptions(
                postgrest_client_timeout=10, storage_client_timeout=10
            ),
        )
        # client = await client.auth.sign_in_with_password(
        #     {"email": settings.DB_EMAIL, "password": settings.DB_PASSWORD}
        # )
        yield client

    except Exception as e:
        print(e)
        raise


SessionDep = Annotated[AsyncClient, Depends(get_db)]
