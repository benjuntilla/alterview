from typing import List
from fastapi import APIRouter, Depends, HTTPException
from supabase._async.client import AsyncClient

from ...dependencies import get_db
from ....schemas.teacher import Teacher, TeacherCreate
from ....crud.teacher import teacher

router = APIRouter()

@router.post("/", response_model=Teacher)
async def create_teacher(teacher_in: TeacherCreate, db: AsyncClient = Depends(get_db)):
    return await teacher.create(db=db, obj_in=teacher_in)

@router.get("/{teacher_id}", response_model=Teacher)
async def read_teacher(teacher_id: int, db: AsyncClient = Depends(get_db)):
    db_teacher = await teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return db_teacher

@router.get("/", response_model=List[Teacher])
async def read_teachers(db: AsyncClient = Depends(get_db)):
    teachers = await teacher.get_all(db)
    return teachers 