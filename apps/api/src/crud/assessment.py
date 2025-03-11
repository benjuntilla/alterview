from typing import Optional

from fastapi import HTTPException
from supabase._async.client import AsyncClient

from .base import CRUDBase
from ..schemas.assessment import Assessment, AssessmentCreate, AssessmentUpdate


class CRUDAssessment(CRUDBase[Assessment, AssessmentCreate, AssessmentUpdate]):
    async def get(self, db: AsyncClient, *, id: int) -> Optional[Assessment]:
        try:
            return await super().get(db, id=str(id))
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"{e.code}: Assessment not found. {e.details}",
            )

    async def get_all(self, db: AsyncClient) -> list[Assessment]:
        try:
            return await super().get_all(db)
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching assessments. {e}",
            )

    async def create(self, db: AsyncClient, *, obj_in: AssessmentCreate) -> Assessment:
        try:
            return await super().create(db, obj_in=obj_in)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"{e.code}: Failed to create assessment. {e.details}",
            )

    async def delete(self, db: AsyncClient, *, id: int) -> Assessment:
        try:
            return await super().delete(db, id=str(id))
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"{e.code}: Failed to delete assessment. {e.details}",
            )


assessment = CRUDAssessment(Assessment) 