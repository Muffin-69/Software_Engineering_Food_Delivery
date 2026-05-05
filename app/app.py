from fastapi import FastAPI, HTTPException

from models.user import UserCreate
from models.order import OrderCreate
from models.review import ReviewCreate

from services.auth_service import register_user, login_user
from services.order_service import (
    create_order,
    get_orders_by_customer,
    get_orders_by_restaurant,
    update_order_status
)
from services.restaurant_service import search_restaurants

app = FastAPI()

# auth

@app.post("/register")
def register(user: UserCreate):
    new_user = register_user(user)
    if not new_user:
        raise HTTPException(status_code=400, detail="User exists")
    return new_user

@app.post("/login")
def login(email: str, password: str):
    user = login_user(email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


# restaurants

@app.get("/restaurants")
def search(query: str):
    return search_restaurants(query)


# orders

@app.post("/orders")
def create_new_order(customer_id: int, order: OrderCreate):
    return create_order(customer_id, order)


@app.get("/orders/customer/{customer_id}")
def get_customer_orders(customer_id: int):
    return get_orders_by_customer(customer_id)


@app.get("/orders/restaurant/{restaurant_id}")
def get_restaurant_orders(restaurant_id: int):
    return get_orders_by_restaurant(restaurant_id)


@app.patch("/orders/{order_id}")
def update_status(order_id: int, status: str):
    updated = update_order_status(order_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return updated