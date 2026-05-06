from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    email: str
    password: str
    role: str  # "customer" or "restaurant"
    # When role is "restaurant" we also create a restaurant entity
    # for this owner and store the link via users.restaurant_id.
    restaurant_name: Optional[str] = None
