from fastapi import APIRouter

from .endpoints import assessments, assessment_results, students, teachers, spells

api_router = APIRouter()

# New endpoints
api_router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
api_router.include_router(assessment_results.router, prefix="/assessment-results", tags=["assessment-results"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])

# Legacy endpoints
api_router.include_router(spells.router, prefix="/spells", tags=["spells"], responses={404: {"description": "Not found"}}) 