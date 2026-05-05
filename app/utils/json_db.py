import json
import os
from threading import Lock

lock = Lock()
BASE_PATH = "data"

def read_json(filename):
    path = os.path.join(BASE_PATH, filename)
    if not os.path.exists(path):
        return []
    with open(path, "r") as f:
        return json.load(f)

def write_json(filename, data):
    path = os.path.join(BASE_PATH, filename)
    with lock:
        with open(path, "w") as f:
            json.dump(data, f, indent=4)

def get_next_id(data):
    if not data:
        return 1
    return max(item["id"] for item in data) + 1