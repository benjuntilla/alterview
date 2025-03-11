from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase._async.client import AsyncClient

from ...dependencies import get_db
from ....schemas.assessment import Assessment, AssessmentCreate
from ....crud.assessment import assessment

router = APIRouter()

@router.post("/", response_model=Assessment)
async def create_assessment(assessment_in: AssessmentCreate, db: AsyncClient = Depends(get_db)):
    return await assessment.create(db=db, obj_in=assessment_in)

@router.get("/{assessment_id}", response_model=Assessment)
async def read_assessment(assessment_id: int, db: AsyncClient = Depends(get_db)):
    db_assessment = await assessment.get(db, id=assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return db_assessment

@router.get("/", response_model=List[Assessment])
async def read_assessments(db: AsyncClient = Depends(get_db)):
    assessments = await assessment.get_all(db)
    return assessments

@router.delete("/{assessment_id}", response_model=Assessment)
async def delete_assessment(assessment_id: int, db: AsyncClient = Depends(get_db)):
    return await assessment.delete(db, id=assessment_id) 