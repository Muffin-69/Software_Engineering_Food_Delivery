# Supabase setup for Eatout

Two pieces live in this folder:

- **`schema.sql`** — creates the database tables (run once via the Supabase dashboard).
- **`seed.js`** — loads the demo data from `app/data/*.json` into those tables (run any time you want a clean dataset).

The whole "set up the DB" task is **three steps** and takes about five minutes the first time.

---

## Step 1 — create a free Supabase project

1. Go to <https://supabase.com> and sign up (GitHub login is fastest).
2. Click **New project**, pick any name, set a database password (save it somewhere — you won't need it for these scripts but you'll want it later), choose the closest region, and create.
3. Wait ~1 minute for the project to provision.

## Step 2 — load the schema

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar.
2. Click **+ New query**.
3. Open `schema.sql` from this folder, copy its entire contents, and paste it into the editor.
4. Click **Run** (bottom-right). You should see "Success. No rows returned." That's correct — it just created tables.

You can re-run `schema.sql` any time you want a clean reset. The script drops the tables before recreating them.

## Step 3 — load the demo data

In a terminal:

```bash
cd supabase
npm install
cp .env.example .env       # Windows PowerShell: copy .env.example .env
```

Now open `.env` and fill in two values from the Supabase dashboard:

- Go to **Project Settings → API**.
- Copy the **Project URL** into `SUPABASE_URL`.
- Copy the **service_role** secret (NOT the anon key) into `SUPABASE_SERVICE_KEY`.

> ⚠️ The service_role key bypasses Row Level Security. It's safe to use in this script (your machine, never committed) but **never** put it in browser code.

Then run:

```bash
npm run seed
```

You should see:

```
Wiping existing rows…
Inserting restaurants and dishes…
  ✓ Pizza Palace         (3 dishes)
  ✓ Burger House         (3 dishes)
  ...
Inserting users…
  ✓ customer@mail.com
  ✓ restaurant@mail.com  (manages: Pizza Palace)
Inserting a couple of fake orders…
  ✓ fake order #1 (status: preparing)

✅ Seed complete.
```

You can re-run `npm run seed` any time you want to wipe everything and start fresh.

---

## What's in the database now

After seeding you'll have:

- **5 restaurants** with **15 dishes** total, matching `app/data/restaurants.json`.
- **2 demo users**, both with password `password123`:
  - `customer@mail.com` (role: customer)
  - `restaurant@mail.com` (role: restaurant, manages Pizza Palace)
- **1 fake order** with status "preparing" so the order-history / owner-incoming-orders screens have something to show.
- Empty `reviews` table — add your own via the app or the SQL editor.

You can browse and edit any of this directly in the Supabase dashboard under **Table Editor** in the left sidebar. Each table looks like a spreadsheet you can edit cell-by-cell. Great for adding more fake orders manually.

---

## Adding more fake data manually

Either:
- Open the **Table Editor** in Supabase, click into a table, hit "Insert row", and fill in the form, or
- Use the **SQL Editor** to run a one-liner like:

```sql
INSERT INTO orders (customer_id, restaurant_id, status)
VALUES (1, 2, 'pending');

INSERT INTO order_items (order_id, dish_id, quantity, unit_price)
VALUES (currval('orders_id_seq'), 4, 1, 7.99);
```

---

## Migrating the app to use Supabase

When you're ready, the only files you need to touch in `frontend/src/` are:

- `data/restaurants.ts` — replace seed-and-localStorage with `await supabase.from('restaurants').select(...)`.
- `data/restaurantApi.ts` — replace each function body with a `supabase.from(...).insert/update/delete` call (the comments at the top of that file already show what each replacement looks like).
- `data/authApi.ts` — replace with either Supabase Auth (`supabase.auth.signUp/signInWithPassword/signOut`) or simple queries against the `users` table.

Every page in the app keeps working without any change. That's the whole point of putting all storage behind those three adapter files.
