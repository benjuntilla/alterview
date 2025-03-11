from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase._async.client import AsyncClient

from ...dependencies import get_db
from ....schemas.student import Student, StudentCreate
from ....crud.student import student

router = APIRouter()

@router.post("/", response_model=Student)
async def create_student(student_in: StudentCreate, db: AsyncClient = Depends(get_db)):
    return await student.create(db=db, obj_in=student_in)

@router.get("/{student_id}", response_model=Student)
async def read_student(student_id: int, db: AsyncClient = Depends(get_db)):
    db_student = await student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@router.get("/", response_model=List[Student])
async def read_students(db: AsyncClient = Depends(get_db)):
    students = await student.get_all(db)
    return students 