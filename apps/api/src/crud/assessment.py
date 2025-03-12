from typing import Optional

from fastapi import HTTPException
from supabase._async.client import AsyncClient

from .base import CRUDBase
from ..schemas.assessment import Assessment, AssessmentCreate, AssessmentUpdate


class CRUDAssessment(CRUDBase[Assessment, AssessmentCreate, AssessmentUpdate]):
    async def get(self, db: AsyncClient, *, id: int) -> Optional[Assessment]:
        try:
            response = await db.table(self.model.table_name).select("*").eq("id", id).single().execute()
            if not response.data:
                return None
            return self.model(**response.data)
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

    async def get_by_teacher(self, db: AsyncClient, teacher_id: int) -> list[Assessment]:
        try:
            response = await db.table(self.model.table_name).select("*").eq("teacher_id", teacher_id).execute()
            return [self.model(**record) for record in response.data]
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching teacher's assessments. {e}",
            )

    async def get_by_student(self, db: AsyncClient, student_id: int) -> list[Assessment]:
        try:
            # First get the student to get their assessment_ids
            student_response = await db.table("Student").select("assessment_ids").eq("id", student_id).execute()
            if not student_response.data:
                raise HTTPException(status_code=404, detail="Student not found")
            
            assessment_ids = student_response.data[0]["assessment_ids"]
            if not assessment_ids:
                return []
            
            # Then get all assessments with those IDs
            response = await db.table(self.model.table_name).select("*").in_("id", assessment_ids).execute()
            return [self.model(**record) for record in response.data]
        except HTTPException as he:
            raise he
        except Exception as e:
            raise HTTPException(
                status_code=404,
                detail=f"An error occurred while fetching student's assessments. {e}",
            )


assessment = CRUDAssessment(Assessment) 