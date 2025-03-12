from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase._async.client import AsyncClient

from ...dependencies import get_db
from ....schemas.assessment_result import AssessmentResult, AssessmentResultCreate, AssessmentResultUpdate
from ....crud.assessment_result import assessment_result

router = APIRouter()

@router.post("/", response_model=AssessmentResult)
async def create_assessment_result(result_in: AssessmentResultCreate, db: AsyncClient = Depends(get_db)):
    return await assessment_result.create(db=db, obj_in=result_in)

@router.get("/{result_id}", response_model=AssessmentResult)
async def read_assessment_result(result_id: int, db: AsyncClient = Depends(get_db)):
    db_result = await assessment_result.get(db, id=result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Assessment result not found")
    return db_result

@router.get("/student/{student_id}", response_model=List[AssessmentResult])
async def read_student_results(student_id: int, db: AsyncClient = Depends(get_db)):
    results = await assessment_result.get_by_student(db, student_id=student_id)
    return results

@router.get("/teacher/{teacher_id}", response_model=List[AssessmentResult])
async def read_teacher_results(teacher_id: int, db: AsyncClient = Depends(get_db)):
    results = await assessment_result.get_by_teacher(db, teacher_id=teacher_id)
    return results

@router.put("/{result_id}", response_model=AssessmentResult)
async def update_assessment_result(result_id: int, result_in: AssessmentResultUpdate, db: AsyncClient = Depends(get_db)):
    result_in.id = result_id
    return await assessment_result.update(db, obj_in=result_in)

@router.post("/{result_id}/process", response_model=AssessmentResult)
async def process_assessment_result(
    result_id: int, 
    db: AsyncClient = Depends(get_db)
):
    # Get the existing result
    result = await assessment_result.get(db, id=result_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Assessment result not found")
    
    # Call the Supabase Edge Function
    response = await db.functions().invoke(
        'process-transcript',
        {
            'transcript': result.transcript,
            'mindmap_template': result.mindmap
        }
    )
    
    if 'error' in response:
        raise HTTPException(status_code=400, detail=response['error'])
    
    # Update the result with the processed template
    update_data = AssessmentResultUpdate(
        id=result_id,
        mindmap=response['mindmap']
    )
    
    return await assessment_result.update(db=db, obj_in=update_data) 