from typing import ClassVar
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# Shared properties
# class CRUDBaseModel(BaseModel):
#     # where the data
#     table_name: str


# Properties to receive on item creation
# in
class CreateBase(BaseModel):
    """Base class for create schemas"""

    model_config = ConfigDict(from_attributes=True)


# Properties to receive on item update
# in
class UpdateBase(BaseModel):
    """Base class for update schemas"""

    id: int

    model_config = ConfigDict(from_attributes=True)


# response
# Properties shared by models stored in DB
class InDBBase(BaseModel):
    id: str
    user_id: str
    created_at: str


# Properties to return to client
# crud model
# out
class ResponseBase(BaseModel):
    """Base class for response schemas"""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
