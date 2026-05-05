import bcrypt
from utils.json_db import read_json, write_json, get_next_id


def hash_password(password: str):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str):
    return bcrypt.checkpw(password.encode(), hashed.encode())


def register_user(user):
    users = read_json("users.json")

    # check if email already exists
    for u in users:
        if u["email"] == user.email:
            return None

    new_user = {
        "id": get_next_id(users),
        "email": user.email,
        "password": hash_password(user.password),
        "role": user.role
    }

    users.append(new_user)
    write_json("users.json", users)

    return new_user


def login_user(email, password):
    users = read_json("users.json")

    for u in users:
        if u["email"] == email and verify_password(password, u["password"]):
            return u

    return None