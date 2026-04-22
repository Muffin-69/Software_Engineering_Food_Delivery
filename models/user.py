from pydantic import BaseModel

class User(BaseModel):
    email: str
    password: str
    role: str  # "customer" "restaurant" "delivery"