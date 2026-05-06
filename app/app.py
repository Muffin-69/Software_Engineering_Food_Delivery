"""
Eatout — FastAPI backend.

All persistence now lives in Supabase (see supabase/schema.sql).
The service modules in services/ talk to the database; this file
just wires HTTP routes to them.

Run with:
    cd app
    python -m uvicorn app:app --reload --port 8000

Then open http://localhost:8000/docs for the auto-generated API
testing UI.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.user import UserCreate
from models.order import OrderCreate
from models.review import ReviewCreate  # noqa: F401 — kept for future /reviews endpoint

from services.auth_service import register_user, login_user
from services.order_service import (
    create_order,
    get_orders_by_customer,
    get_orders_by_restaurant,
    update_order_status,
)
from services.restaurant_service import search_restaurants

app = FastAPI(title="Eatout API")

# ─────────────────────────────────────────────────────────────
#  CORS
#  The React dev server runs at http://localhost:5173 by default.
#  Without these middleware settings, the browser blocks every
#  cross-origin request and you get cryptic "CORS policy" errors
#  in the JS console.
#
#  For a class-project demo, allow_origins=["*"] is fine. For
#  production you'd lock this down to your real frontend's URL.
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
#  Auth
# ─────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/register")
def register(user: UserCreate):
    new_user = register_user(user)
    if not new_user:
        raise HTTPException(status_code=400, detail="User already exists")
    return new_user


@app.post("/login")
def login(payload: LoginRequest):
    user = login_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


# ─────────────────────────────────────────────────────────────
#  Restaurants
# ─────────────────────────────────────────────────────────────


@app.get("/restaurants")
def search(query: str = ""):
    return search_restaurants(query)


# ─────────────────────────────────────────────────────────────
#  Orders
# ─────────────────────────────────────────────────────────────


@app.post("/orders")
def create_new_order(customer_id: int, order: OrderCreate):
    new_order = create_order(customer_id, order)
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
def update_status(order_id: int, status: str):
    updated = update_order_status(order_id, status)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found or invalid status")
    return updated
