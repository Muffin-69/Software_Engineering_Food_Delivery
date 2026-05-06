"""
Order service — Supabase-backed.

Schema (see supabase/schema.sql):
  • orders        — header (customer, restaurant, status, created_at)
  • order_items   — line items with quantity + unit_price snapshot

Creating an order is a two-step insert: header first, then items.
"""

from utils.supabase_client import supabase


VALID_STATUSES = {"pending", "preparing", "on-the-way", "delivered", "cancelled"}


def _get_order_with_items(order_id: int):
    result = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("id", order_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def create_order(order_data):
    """order_data: OrderCreate Pydantic model with customer_id, restaurant_id, items[]"""
    # 1. Header
    order_payload = {
        "customer_id": order_data.customer_id,
        "restaurant_id": order_data.restaurant_id,
        "status": "pending",
    }
    order_result = supabase.table("orders").insert(order_payload).execute()
    if not order_result.data:
        return None
    order = order_result.data[0]

    # 2. Snapshot dish prices
    dish_ids = [item.dish_id for item in order_data.items]
    if dish_ids:
        dishes_result = (
            supabase.table("dishes")
            .select("id, price")
            .in_("id", dish_ids)
            .execute()
        )
        price_map = {d["id"]: d["price"] for d in (dishes_result.data or [])}
    else:
        price_map = {}

    # 3. Line items
    items_payload = [
        {
            "order_id": order["id"],
            "dish_id": item.dish_id,
            "quantity": item.quantity,
            "unit_price": price_map.get(item.dish_id, 0),
        }
        for item in order_data.items
    ]
    if items_payload:
        supabase.table("order_items").insert(items_payload).execute()

    return _get_order_with_items(order["id"])


def get_orders_by_customer(customer_id: int):
    result = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("customer_id", customer_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def get_orders_by_restaurant(restaurant_id: int):
    result = (
        supabase.table("orders")
        .select("*, order_items(*)")
        .eq("restaurant_id", restaurant_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def update_order_status(order_id: int, status: str):
    if status not in VALID_STATUSES:
        return None
    result = (
        supabase.table("orders")
        .update({"status": status})
        .eq("id", order_id)
        .execute()
    )
    if not result.data:
        return None
    return _get_order_with_items(order_id)
