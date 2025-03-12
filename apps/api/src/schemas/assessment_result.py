from typing import Optional, ClassVar
from pydantic import Json

from .base import CreateBase, ResponseBase, UpdateBase

class AssessmentResultBase(CreateBase):
    assessment_id: int
    teacher_id: int
    student_id: int
    voice_recording_id: Optional[int] = None
    transcript: Optional[str] = None
    mindmap: Optional[Json] = None
    table_name: ClassVar[str] = "AssessmentResult"

class AssessmentResultCreate(AssessmentResultBase):
    pass

class AssessmentResultUpdate(AssessmentResultBase, UpdateBase):
    pass

class AssessmentResult(AssessmentResultBase, ResponseBase):
    pass 