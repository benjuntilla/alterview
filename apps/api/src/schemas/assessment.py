from typing import Optional, ClassVar

from .base import CreateBase, ResponseBase, UpdateBase

class AssessmentBase(CreateBase):
    name: str
    first_question: str
    system_prompt: str
    mindmap_template: str
    table_name: ClassVar[str] = "Assessment"
    teacher_id: int | None = None
    student_id: int | None = None

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(AssessmentBase, UpdateBase):
    pass

class Assessment(AssessmentBase, ResponseBase):
    pass 