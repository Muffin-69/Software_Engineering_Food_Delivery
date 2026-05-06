"""
Auth service — backed by Supabase.

Passwords are hashed with bcrypt and stored in the public `users`
table's `password_hash` column. Note: in production you'd usually
prefer Supabase Auth (the auth.users table) over rolling your own.
This stays close to the original JSON-based design so the rest of
the app keeps the same shape.
"""

import bcrypt
from utils.supabase_client import supabase


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _strip_password(user: dict) -> dict:
    """Never return the password hash to API callers."""
    user = dict(user)  # shallow copy
    user.pop("password_hash", None)
    return user


def register_user(user):
    # Reject duplicate emails before insert — gives a clean error
    # without relying on the DB unique-constraint exception path.
    existing = (
        supabase.table("users")
        .select("id")
        .eq("email", user.email)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    payload = {
        "email": user.email,
        "password_hash": hash_password(user.password),
        "role": user.role,
    }
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
