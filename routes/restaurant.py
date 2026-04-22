from fastapi import APIRouter
from db import restaurants_collection

router = APIRouter()

@router.post("/restaurant")
def create_restaurant(name: str):
    restaurants_collection.insert_one({
        "name": name,
        "menu": []
    })
    return {"message": "Restaurant created"}

@router.post("/restaurant/{id}/menu")
def add_menu_item(id: str, name: str, price: float):
    restaurants_collection.update_one(
        {"_id": id},
        {"$push": {"menu": {"name": name, "price": price}}}
    )
    return {"message": "Item added"}

@router.get("/restaurants")
def get_restaurants():
    return list(restaurants_collection.find({}, {"_id": 0}))