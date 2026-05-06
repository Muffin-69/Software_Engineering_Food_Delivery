"""
Restaurant search — backed by Supabase.

Returns each restaurant with its dishes nested as a sub-array, the
same shape the frontend already expects. Filtering is done in
Python after fetching, which is fine at this scale (a handful of
restaurants). For thousands of rows you'd push the search down into
Postgres with .ilike() / .or() / a tsvector full-text index.
"""

from utils.supabase_client import supabase


def _fetch_all_with_dishes():
    result = (
        supabase.table("restaurants")
        .select("*, dishes(*)")
        .order("id")
        .execute()
    )
    return result.data or []


def search_restaurants(query: str):
    q = (query or "").lower().strip()
    restaurants = _fetch_all_with_dishes()

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
