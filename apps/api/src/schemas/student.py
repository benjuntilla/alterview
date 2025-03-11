from typing import List, ClassVar

from .base import CreateBase, ResponseBase, UpdateBase

class StudentBase(CreateBase):
    name: str
    assessment_ids: List[int] = []
    table_name: ClassVar[str] = "Student"

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase, UpdateBase):
    pass

class Student(StudentBase, ResponseBase):
    pass 