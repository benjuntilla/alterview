from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from supabase._async.client import AsyncClient

from ...dependencies import get_db
from ....schemas.assessment import Assessment, AssessmentCreate
from ....schemas.assessment_result import AssessmentResult
from ....crud.assessment import assessment
from ....crud.assessment_result import assessment_result

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

@router.get("/teacher/{teacher_id}", response_model=List[Assessment])
async def read_teacher_assessments(teacher_id: int, db: AsyncClient = Depends(get_db)):
    assessments = await assessment.get_by_teacher(db, teacher_id=teacher_id)
    return assessments

@router.get("/student/{student_id}", response_model=List[Assessment])
async def read_student_assessments(student_id: int, db: AsyncClient = Depends(get_db)):
    """Get all assessments assigned to a specific student"""
    assessments = await assessment.get_by_student(db, student_id=student_id)
    return assessments

@router.delete("/{assessment_id}", response_model=Assessment)
async def delete_assessment(assessment_id: int, db: AsyncClient = Depends(get_db)):
    return await assessment.delete(db, id=assessment_id)

@router.post("/{assessment_id}/process")
async def process_assessment_results(
    assessment_id: int,
    db: AsyncClient = Depends(get_db)
):
    """Process mindmaps from all assessment results for a given assessment"""
    # First verify the assessment exists
    db_assessment = await assessment.get(db, id=assessment_id)
    if db_assessment is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    try:
        # Get only the mindmap field from assessment results
        results = await db.table("AssessmentResult").select("mindmap").eq("assessment_id", assessment_id).execute()
        if not results.data:
            raise HTTPException(status_code=404, detail="No assessment results found for this assessment")
        
        # Filter out None mindmaps and extract just the mindmap strings
        mindmaps = [result["mindmap"] for result in results.data if result["mindmap"]]
        
        if not mindmaps:
            raise HTTPException(status_code=404, detail="No mindmaps found in assessment results")
        
        # Call the edge function with just the mindmaps
        edge_function_response = await db.functions.invoke(
            "process-assessments",
            {"mindmaps": mindmaps}
        )
        
        # Return the processed string from the edge function
        return {"result": edge_function_response["data"]}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process mindmaps: {str(e)}"
        ) 