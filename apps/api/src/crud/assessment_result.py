from typing import Optional

from fastapi import HTTPException
from supabase._async.client import AsyncClient

from .base import CRUDBase
from ..schemas.assessment_result import AssessmentResult, AssessmentResultCreate, AssessmentResultUpdate


class CRUDAssessmentResult(CRUDBase[AssessmentResult, AssessmentResultCreate, AssessmentResultUpdate]):
    async def get(self, db: AsyncClient, *, id: int) -> Optional[AssessmentResult]:
        try:
            return await super().get(db, id=str(id))
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"{e.code}: Assessment result not found. {e.details}",
            )

    async def get_by_student(self, db: AsyncClient, *, student_id: int) -> list[AssessmentResult]:
        try:
            data, count = (
                await db.table(self.model.table_name)
                .select("*")
                .eq("student_id", student_id)
                .execute()
            )
            _, got = data
            return [self.model(**item) for item in got]
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching student results. {e}",
            )

    async def get_by_teacher(self, db: AsyncClient, *, teacher_id: int) -> list[AssessmentResult]:
        try:
            data, count = (
                await db.table(self.model.table_name)
                .select("*")
                .eq("teacher_id", teacher_id)
                .execute()
            )
            _, got = data
            return [self.model(**item) for item in got]
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching teacher results. {e}",
            )

    async def create(self, db: AsyncClient, *, obj_in: AssessmentResultCreate) -> AssessmentResult:
        try:
            return await super().create(db, obj_in=obj_in)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"{e.code}: Failed to create assessment result. {e.details}",
            )

    async def update(self, db: AsyncClient, *, obj_in: AssessmentResultUpdate) -> AssessmentResult:
        try:
            return await super().update(db, obj_in=obj_in)
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"{e.code}: Failed to update assessment result. {e.details}",
            )


assessment_result = CRUDAssessmentResult(AssessmentResult) 