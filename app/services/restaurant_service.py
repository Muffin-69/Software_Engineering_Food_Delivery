from utils.json_db import read_json

def search_restaurants(query: str):
    restaurants = read_json("restaurants.json")
    result = []

    for r in restaurants:
        if query.lower() in r["name"].lower():
            result.append(r)
            continue

        for d in r.get("dishes", []):
            if query.lower() in d["name"].lower():
                result.append(r)
                break

    return result