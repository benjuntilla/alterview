from typing import ClassVar
from .base import CreateBase, ResponseBase, UpdateBase

class TeacherBase(CreateBase):
    table_name: ClassVar[str] = "Teacher"
    name: str
    pass

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(TeacherBase, UpdateBase):
    pass

class Teacher(TeacherBase, ResponseBase):
    pass 