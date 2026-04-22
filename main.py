from fastapi import FastAPI
from routes import auth, restaurant, order

app = FastAPI()

app.include_router(auth.router)
app.include_router(restaurant.router)
app.include_router(order.router)