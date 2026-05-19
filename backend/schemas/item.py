from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class Item(BaseModel):
    id: UUID
    text: str = Field(max_length=60)
    checked: bool
    position: int
    created_at: datetime
    updated_at: datetime
