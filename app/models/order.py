from pydantic import BaseModel
from typing import List


class OrderItem(BaseModel):
    dish_id: int
    quantity: int


class OrderCreate(BaseModel):
    customer_id: int
    restaurant_id: int
    items: List[OrderItem]


class OrderStatusUpdate(BaseModel):
    status: str  # pending | preparing | on-the-way | delivered | cancelled
