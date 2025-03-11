from .base import CreateBase, ResponseBase, UpdateBase

class TeacherBase(CreateBase):
    pass

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(TeacherBase, UpdateBase):
    pass

class Teacher(TeacherBase, ResponseBase):
    pass 