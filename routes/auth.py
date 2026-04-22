from fastapi import APIRouter
from db import users_collection
from models.user import User

router = APIRouter()

@router.post("/register")
def register(user: User):
    users_collection.insert_one(user.dict())
    return {"message": "User created"}

@router.post("/login")
def login(email: str, password: str):
    user = users_collection.find_one({"email": email, "password": password})
    if user:
        return {"message": "Login successful", "role": user["role"]}
    return {"error": "Invalid credentials"}