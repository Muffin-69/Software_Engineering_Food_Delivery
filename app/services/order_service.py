from utils.json_db import read_json, write_json, get_next_id
from datetime import datetime

def create_order(customer_id, order_data):
    orders = read_json("orders.json")

    new_order = {
        "id": get_next_id(orders),
        "customer_id": customer_id,
        "restaurant_id": order_data.restaurant_id,
        "items": [item.dict() for item in order_data.items],
        "status": "pending",
        "created_at": str(datetime.now())
    }

    orders.append(new_order)
    write_json("orders.json", orders)

    return new_order

def get_orders_by_customer(customer_id):
    orders = read_json("orders.json")
    return [o for o in orders if o["customer_id"] == customer_id]

def get_orders_by_restaurant(restaurant_id):
    orders = read_json("orders.json")
    return [o for o in orders if o["restaurant_id"] == restaurant_id]

def update_order_status(order_id, status):
    orders = read_json("orders.json")

    for o in orders:
        if o["id"] == order_id:
            o["status"] = status
            write_json("orders.json", orders)
            return o

    return None