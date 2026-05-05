from pydantic import BaseModel

class ReviewCreate(BaseModel):
    restaurant_id: int
    rating: int
    comment: str