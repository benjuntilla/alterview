from typing import Optional, ClassVar
from pydantic import Json

from .base import CreateBase, ResponseBase, UpdateBase

class AssessmentBase(CreateBase):
    name: str
    first_question: str
    system_prompt: str
    mindmap_template: Json
    table_name: ClassVar[str] = "Assessment"

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(AssessmentBase, UpdateBase):
    pass

class Assessment(AssessmentBase, ResponseBase):
    pass 