-- ─────────────────────────────────────────────────────────────
--  Eatout — Supabase / Postgres schema
--
--  How to use:
--    1. Create a new project at https://supabase.com
--    2. Open the SQL Editor (left sidebar in the dashboard)
--    3. Paste the entire contents of this file
--    4. Click "Run"
--    5. Then run the seed script (see supabase/README.md)
--
--  Re-running this file is destructive: it drops the existing
--  tables before re-creating them. That's intentional — it gives
--  you a clean reset whenever you want one.
-- ─────────────────────────────────────────────────────────────

-- Drop tables in reverse dependency order so foreign keys
-- don't block us. CASCADE handles any leftover refs.
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders      CASCADE;
DROP TABLE IF EXISTS reviews     CASCADE;
DROP TABLE IF EXISTS dishes      CASCADE;
DROP TABLE IF EXISTS users       CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- ─────────────────────────────────────────────────────────────
--  Restaurants
-- ─────────────────────────────────────────────────────────────
CREATE TABLE restaurants (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT     NOT NULL,
    description TEXT     NOT NULL DEFAULT '',
    rating      SMALLINT NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    tags        TEXT[]   NOT NULL DEFAULT ARRAY[]::TEXT[],
    address     TEXT     NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  Users
--  Note: For production, prefer Supabase Auth (the built-in
--  auth.users table) and keep app-specific fields in a separate
--  "profiles" table. For this class project we keep it simple
--  and roll our own users table — bcrypt-hashed passwords and
--  all, mirroring the JSON-based backend.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,            -- bcrypt
    role          TEXT NOT NULL CHECK (role IN ('customer', 'restaurant')),
    -- Restaurant owners are linked to the restaurant they manage.
    -- Customers leave this NULL.
    restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
--  Dishes  (one restaurant has many dishes)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE dishes (
    id            BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name          TEXT   NOT NULL,
    price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dishes_restaurant ON dishes(restaurant_id);

-- ─────────────────────────────────────────────────────────────
--  Orders  (header) and order_items (line items)
--  Splitting orders into two tables is the standard relational
--  pattern — one row per order, plus N rows per dish ordered.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE orders (
    id            BIGSERIAL PRIMARY KEY,
    customer_id   BIGINT NOT NULL REFERENCES users(id),
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id),
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','preparing','on-the-way','delivered','cancelled')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer   ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);

CREATE TABLE order_items (
    id          BIGSERIAL PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id     BIGINT NOT NULL REFERENCES dishes(id),
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    -- Unit price is captured at order time so historical orders
    -- stay correct even if the dish price changes later.
    unit_price  NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ─────────────────────────────────────────────────────────────
--  Reviews
-- ─────────────────────────────────────────────────────────────
CREATE TABLE reviews (
    id            BIGSERIAL PRIMARY KEY,
    restaurant_id BIGINT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_id   BIGINT NOT NULL REFERENCES users(id),
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);

-- ─────────────────────────────────────────────────────────────
--  Row Level Security (RLS)
--
--  Supabase enables RLS on every new table by default. With no
--  policies set, the public anon key cannot read or write
--  ANYTHING — your frontend would just see empty results.
--
--  For a class project we DISABLE RLS so the demo works out of
--  the box. ⚠️ This is unsafe for a real public deployment —
--  in production, keep RLS on and write policies like:
--
--    -- "anyone can read restaurants"
--    CREATE POLICY restaurants_read ON restaurants
--      FOR SELECT USING (true);
--
--    -- "owners can update their own restaurant"
--    CREATE POLICY restaurants_owner_update ON restaurants
--      FOR UPDATE USING (
--        id = (SELECT restaurant_id FROM users WHERE id = auth.uid())
--      );
-- ─────────────────────────────────────────────────────────────
ALTER TABLE restaurants  DISABLE ROW LEVEL SECURITY;
ALTER TABLE users        DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes       DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders       DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      DISABLE ROW LEVEL SECURITY;

-- Done. Run supabase/seed.js next to load the demo data.
