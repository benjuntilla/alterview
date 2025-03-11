from typing import Optional

from fastapi import HTTPException
from supabase._async.client import AsyncClient

from .base import CRUDBase
from ..schemas.teacher import Teacher, TeacherCreate, TeacherUpdate


class CRUDTeacher(CRUDBase[Teacher, TeacherCreate, TeacherUpdate]):
    async def get(self, db: AsyncClient, *, id: int) -> Optional[Teacher]:
        try:
            return await super().get(db, id=str(id))
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"{e.code}: Teacher not found. {e.details}",
            )

    async def get_all(self, db: AsyncClient) -> list[Teacher]:
        try:
            return await super().get_all(db)
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching teachers. {e}",
            )

    async def create(self, db: AsyncClient, *, obj_in: TeacherCreate) -> Teacher:
        try:
            return await super().create(db, obj_in=obj_in)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"{e.code}: Failed to create teacher. {e.details}",
            )


teacher = CRUDTeacher(Teacher) 