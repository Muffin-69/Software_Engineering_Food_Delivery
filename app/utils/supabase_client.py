"""
Supabase client for the FastAPI backend.

Loads SUPABASE_URL and SUPABASE_SERVICE_KEY from the .env file in
the app/ folder (the same folder where uvicorn runs from). The
backend uses the *service_role* secret because it's the trusted
server — service_role bypasses Row Level Security so the API can
read and write any row regardless of the logged-in user.

NEVER use the service_role key in the React frontend. It has
full database access. Browser code must use the publishable
(anon) key only.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load app/.env (relative to wherever uvicorn was started)
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.\n"
        "Copy app/.env.example to app/.env and fill in the values\n"
        "from your Supabase dashboard (Project Settings → API)."
    )

# Trim a trailing /rest/v1/ if someone copied the wrong URL —
# the Supabase client adds that path itself.
SUPABASE_URL = SUPABASE_URL.rstrip("/").removesuffix("/rest/v1")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
