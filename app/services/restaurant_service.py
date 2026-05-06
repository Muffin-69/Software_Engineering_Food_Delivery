"""
Restaurant service — Supabase-backed.

Read functions return restaurants with their dishes nested as a
sub-array (the same shape the frontend expects).
Write functions cover everything the owner edit page needs.
"""

from utils.supabase_client import supabase


def _select_with_dishes():
    return supabase.table("restaurants").select("*, dishes(*)")


def _normalise_tags(tags):
    """Lowercase, trim, dedupe — keep the data tidy."""
    if tags is None:
        return None
    seen = set()
    cleaned = []
    for t in tags:
        v = (t or "").strip().lower()
        if v and v not in seen:
            seen.add(v)
            cleaned.append(v)
    return cleaned


# ── Reads ──────────────────────────────────────────────────────


def search_restaurants(query: str):
    q = (query or "").lower().strip()
    result = _select_with_dishes().order("id").execute()
    restaurants = result.data or []

    if not q:
        return restaurants

    matched = []
    for r in restaurants:
        if q in (r.get("name") or "").lower():
            matched.append(r)
            continue
        if any(q in (t or "").lower() for t in (r.get("tags") or [])):
            matched.append(r)
            continue
        if any(
            q in (d.get("name") or "").lower() for d in (r.get("dishes") or [])
        ):
            matched.append(r)
            continue

    return matched


def get_restaurant_by_id(restaurant_id: int):
    result = (
        _select_with_dishes()
        .eq("id", restaurant_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


# ── Writes ─────────────────────────────────────────────────────


def create_restaurant(payload):
    """payload: RestaurantCreate Pydantic model"""
    name = (payload.name or "").strip()
    if not name:
        return None
    row = {
        "name": name,
        "description": (payload.description or "").strip(),
        "address": (payload.address or "").strip(),
        "rating": 0,
        "tags": _normalise_tags(payload.tags) or [],
    }
    result = supabase.table("restaurants").insert(row).execute()
    if not result.data:
        return None
    return get_restaurant_by_id(result.data[0]["id"])


def update_restaurant_info(restaurant_id: int, payload):
    """payload: RestaurantUpdate Pydantic model"""
    updates = {}
    if payload.name is not None:
        n = payload.name.strip()
        if not n:
            return None
        updates["name"] = n
    if payload.description is not None:
        updates["description"] = payload.description.strip()
    if payload.address is not None:
        updates["address"] = payload.address.strip()
    if payload.tags is not None:
        updates["tags"] = _normalise_tags(payload.tags) or []
    if not updates:
        return get_restaurant_by_id(restaurant_id)

    result = (
        supabase.table("restaurants")
        .update(updates)
        .eq("id", restaurant_id)
        .execute()
    )
    if not result.data:
        return None
    return get_restaurant_by_id(restaurant_id)


def add_dish(restaurant_id: int, payload):
    """payload: DishCreate Pydantic model"""
    name = (payload.name or "").strip()
    if not name:
        return None
    if payload.price is None or payload.price < 0:
        return None

    # Verify restaurant exists
    if get_restaurant_by_id(restaurant_id) is None:
        return None

    row = {
        "restaurant_id": restaurant_id,
        "name": name,
        "price": payload.price,
    }
    result = supabase.table("dishes").insert(row).execute()
    return result.data[0] if result.data else None


def update_dish(dish_id: int, payload):
    """payload: DishUpdate Pydantic model"""
    updates = {}
    if payload.name is not None:
        n = payload.name.strip()
        if not n:
            return None
        updates["name"] = n
    if payload.price is not None:
        if payload.price < 0:
            return None
        updates["price"] = payload.price
    if not updates:
        # Nothing to change — just return current row
        cur = (
            supabase.table("dishes")
            .select("*")
            .eq("id", dish_id)
            .limit(1)
            .execute()
        )
        return cur.data[0] if cur.data else None

    result = (
        supabase.table("dishes")
        .update(updates)
        .eq("id", dish_id)
        .execute()
    )
    return result.data[0] if result.data else None


def delete_dish(dish_id: int) -> bool:
    result = supabase.table("dishes").delete().eq("id", dish_id).execute()
    return bool(result.data)
