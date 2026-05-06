"""
Auth service — Supabase-backed.

Passwords are bcrypt-hashed and stored in the public users table.
For "restaurant" role accounts we also create the restaurant
entity they will manage and link it via users.restaurant_id.
"""

import bcrypt
from utils.supabase_client import supabase


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _strip_password(user: dict) -> dict:
    user = dict(user)
    user.pop("password_hash", None)
    return user


def register_user(user):
    # Reject duplicates
    existing = (
        supabase.table("users")
        .select("id")
        .eq("email", user.email)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    # For restaurant accounts, create the restaurant first so we
    # can link it on the user row.
    restaurant_id = None
    if user.role == "restaurant":
        if not user.restaurant_name or not user.restaurant_name.strip():
            return None
        new_restaurant = (
            supabase.table("restaurants")
            .insert(
                {
                    "name": user.restaurant_name.strip(),
                    "description": "",
                    "rating": 0,
                    "tags": [],
                }
            )
            .execute()
        )
        if not new_restaurant.data:
            return None
        restaurant_id = new_restaurant.data[0]["id"]

    payload = {
        "email": user.email,
        "password_hash": hash_password(user.password),
        "role": user.role,
    }
    if restaurant_id is not None:
        payload["restaurant_id"] = restaurant_id

    result = supabase.table("users").insert(payload).execute()
    if not result.data:
        return None
    return _strip_password(result.data[0])


def login_user(email: str, password: str):
    result = (
        supabase.table("users")
        .select("*")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None

    row = result.data[0]
    if not verify_password(password, row["password_hash"]):
        return None
    return _strip_password(row)
