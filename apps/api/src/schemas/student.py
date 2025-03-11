from typing import List

from .base import CreateBase, ResponseBase, UpdateBase

class StudentBase(CreateBase):
    assessment_ids: List[int] = []

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase, UpdateBase):
    pass

class Student(StudentBase, ResponseBase):
    pass 