import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client["food_app"]
restaurants_collection = db["restaurants"]
orders_collection = db["orders"]