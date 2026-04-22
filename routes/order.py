from fastapi import APIRouter
from db import orders_collection

router = APIRouter()

@router.post("/order")
def create_order(customer_email: str, restaurant: str, items: list):
    order = {
        "customer": customer_email,
        "restaurant": restaurant,
        "items": items,
        "status": "pending"
    }
    orders_collection.insert_one(order)
    return {"message": "Order placed"}

@router.put("/order/status")
def update_status(order_id: str, status: str):
    orders_collection.update_one(
        {"_id": order_id},
        {"$set": {"status": status}}
    )
    return {"message": "Status updated"}