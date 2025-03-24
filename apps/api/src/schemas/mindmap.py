from typing import List, Optional
from pydantic import BaseModel, Field

class Subtopic(BaseModel):
    name: str
    description: str
    subtopics: List['Subtopic'] = Field(default_factory=list)

class Topic(BaseModel):
    name: str
    description: str
    subtopics: List[Subtopic]

class MindmapResponse(BaseModel):
    topic: Topic

class MindmapRequest(BaseModel):
    text: str = Field(..., min_length=1) 