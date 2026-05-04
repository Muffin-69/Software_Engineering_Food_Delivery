from pydantic import BaseModel
from typing import List

class OrderItem(BaseModel):
    dish_id: int
    quantity: int

class OrderCreate(BaseModel):
    restaurant_id: int
    items: List[OrderItem]