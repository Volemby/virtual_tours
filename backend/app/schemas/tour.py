from pydantic import BaseModel
from typing import Optional

class TourBase(BaseModel):
    id: str
    name: str

class Tour(TourBase):
    url: str
    coverUrl: Optional[str] = None
    mainFile: str

class TourCreate(BaseModel):
    id: str
    
class TourResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Tour] = None
