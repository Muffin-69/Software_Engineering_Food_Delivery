from pydantic import BaseModel
from typing import List, Optional


class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tags: Optional[List[str]] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class DishCreate(BaseModel):
    name: str
    price: float


class DishUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
