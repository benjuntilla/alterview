from typing import Optional

from fastapi import HTTPException
from supabase._async.client import AsyncClient

from .base import CRUDBase
from ..schemas.student import Student, StudentCreate, StudentUpdate


class CRUDStudent(CRUDBase[Student, StudentCreate, StudentUpdate]):
    async def get(self, db: AsyncClient, *, id: int) -> Optional[Student]:
        try:
            return await super().get(db, id=str(id))
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"{e.code}: Student not found. {e.details}",
            )

    async def get_all(self, db: AsyncClient) -> list[Student]:
        try:
            return await super().get_all(db)
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching students. {e}",
            )

    async def create(self, db: AsyncClient, *, obj_in: StudentCreate) -> Student:
        try:
            return await super().create(db, obj_in=obj_in)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"{e.code}: Failed to create student. {e.details}",
            )


student = CRUDStudent(Student) 