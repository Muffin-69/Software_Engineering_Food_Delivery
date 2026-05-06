"""
Eatout — FastAPI backend.

All persistence lives in Supabase (see supabase/schema.sql).
This file just wires HTTP routes to the service layer.

Run with:
    cd app
    python -m uvicorn app:app --reload --port 8000

Then open http://localhost:8000/docs for the auto-generated UI.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.user import UserCreate
from models.order import OrderCreate, OrderStatusUpdate
from models.restaurant import (
    RestaurantCreate,
    RestaurantUpdate,
    DishCreate,
    DishUpdate,
)

from services.auth_service import register_user, login_user
from services.order_service import (
    create_order,
    get_orders_by_customer,
    get_orders_by_restaurant,
    update_order_status,
)
from services.restaurant_service import (
    search_restaurants,
    get_restaurant_by_id,
    create_restaurant,
    update_restaurant_info,
    add_dish,
    update_dish,
    delete_dish,
)

app = FastAPI(title="Eatout API")

# CORS — open for class-project demo. Lock down origins in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
#  Auth
# ──────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/register")
def register(user: UserCreate):
    if user.role == "restaurant" and (
        not user.restaurant_name or not user.restaurant_name.strip()
    ):
        raise HTTPException(
            status_code=400,
            detail="Restaurant accounts need a restaurant name.",
        )
    new_user = register_user(user)
    if not new_user:
        raise HTTPException(
            status_code=400,
            detail="An account with that email already exists.",
        )
    return new_user


@app.post("/login")
def login(payload: LoginRequest):
    user = login_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return user


# ──────────────────────────────────────────────────────────────
#  Restaurants — read
# ──────────────────────────────────────────────────────────────


@app.get("/restaurants")
def search(query: str = ""):
    return search_restaurants(query)


@app.get("/restaurants/{restaurant_id}")
def get_one(restaurant_id: int):
    r = get_restaurant_by_id(restaurant_id)
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return r


# ──────────────────────────────────────────────────────────────
#  Restaurants — write (owner)
# ──────────────────────────────────────────────────────────────


@app.post("/restaurants")
def create_one(payload: RestaurantCreate):
    r = create_restaurant(payload)
    if not r:
        raise HTTPException(status_code=400, detail="Could not create restaurant")
    return r


@app.patch("/restaurants/{restaurant_id}")
def update_one(restaurant_id: int, payload: RestaurantUpdate):
    r = update_restaurant_info(restaurant_id, payload)
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return r


# ──────────────────────────────────────────────────────────────
#  Dishes — write (owner)
# ──────────────────────────────────────────────────────────────


@app.post("/restaurants/{restaurant_id}/dishes")
def add_one_dish(restaurant_id: int, payload: DishCreate):
    d = add_dish(restaurant_id, payload)
    if not d:
        raise HTTPException(status_code=400, detail="Could not add dish")
    return d


@app.patch("/dishes/{dish_id}")
def patch_dish(dish_id: int, payload: DishUpdate):
    d = update_dish(dish_id, payload)
    if not d:
        raise HTTPException(status_code=404, detail="Dish not found")
    return d


@app.delete("/dishes/{dish_id}")
def remove_dish(dish_id: int):
    ok = delete_dish(dish_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Dish not found")
    return {"ok": True}


# ──────────────────────────────────────────────────────────────
#  Orders
# ──────────────────────────────────────────────────────────────


@app.post("/orders")
def create_new_order(order: OrderCreate):
    new_order = create_order(order)
    if not new_order:
        raise HTTPException(status_code=500, detail="Could not create order")
    return new_order


@app.get("/orders/customer/{customer_id}")
def get_customer_orders(customer_id: int):
    return get_orders_by_customer(customer_id)


@app.get("/orders/restaurant/{restaurant_id}")
def get_restaurant_orders(restaurant_id: int):
    return get_orders_by_restaurant(restaurant_id)


@app.patch("/orders/{order_id}")
def update_status(order_id: int, payload: OrderStatusUpdate):
    updated = update_order_status(order_id, payload.status)
    if not updated:
        raise HTTPException(
            status_code=404, detail="Order not found or invalid status"
        )
    return updated
