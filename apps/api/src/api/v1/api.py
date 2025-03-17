from fastapi import APIRouter, Depends

from .endpoints import assessments, assessment_results, students, teachers, spells
from .auth import get_api_key

api_router = APIRouter(dependencies=[Depends(get_api_key)])

# New endpoints
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(assessment_results.router, prefix="/assessment-results", tags=["assessment-results"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])

# Legacy endpoints
api_router.include_router(spells.router, prefix="/spells", tags=["spells"], responses={404: {"description": "Not found"}}) 