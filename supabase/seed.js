/* ──────────────────────────────────────────────────────────────
 *  Eatout — Supabase seed script
 *
 *  Wipes the database and re-loads it from the JSON files in
 *  app/data/. Re-runnable any time you want a clean reset.
 *
 *  Setup (only the first time):
 *    cd supabase
 *    npm install
 *    cp .env.example .env
 *    # then edit .env and fill in SUPABASE_URL + SUPABASE_SERVICE_KEY
 *
 *  Run:
 *    node seed.js
 *
 *  Where to find the values:
 *    Supabase dashboard → Project Settings → API
 *      • SUPABASE_URL          = "Project URL"
 *      • SUPABASE_SERVICE_KEY  = "service_role" secret  ⚠️ keep private
 *
 *  Why service_role? Because RLS would otherwise block the seed
 *  from inserting rows. Service role bypasses RLS — perfect for
 *  trusted server-side scripts but never expose it in the browser.
 * ────────────────────────────────────────────────────────────── */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

let SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY.\n" +
      "Copy .env.example to .env and fill in the values from\n" +
      "Supabase dashboard → Project Settings → API."
  );
  process.exit(1);
}

// Strip any trailing /rest/v1 (or trailing slashes) — the Supabase
// client adds that path itself, so passing it in causes doubled
// paths like /rest/v1//rest/v1/order_items and confusing errors.
SUPABASE_URL = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

/* ── helpers ─────────────────────────────────────────────────── */

function loadJson(relPath) {
  const full = resolve(__dirname, relPath);
  return JSON.parse(readFileSync(full, "utf-8"));
}

async function wipeAll() {
  // Delete in reverse dependency order so FKs don't block us.
  // Using .not("id", "is", null) instead of .gte("id", 0) because
  // recent supabase-js versions inject a UUID-based safety filter
  // when a "trivial" range filter is detected, and that conflicts
  // with bigint id columns ("invalid input syntax for type bigint").
  console.log("Wiping existing rows…");
  for (const table of [
    "order_items",
    "orders",
    "reviews",
    "dishes",
    "users",
    "restaurants",
  ]) {
    const { error } = await supabase
      .from(table)
      .delete()
      .not("id", "is", null);
    if (error) {
      // It's fine if the table is already empty.
      if (!/no rows/i.test(error.message)) {
        throw new Error(`While clearing ${table}: ${error.message}`);
      }
    }
  }
}

/* ── main ────────────────────────────────────────────────────── */

async function main() {
  const restaurants = loadJson("../app/data/restaurants.json");
  const users = loadJson("../app/data/users.json");

  await wipeAll();

  // Map JSON ids → freshly-assigned database ids, since we let
  // BIGSERIAL auto-generate primary keys.
  const restaurantIdMap = new Map(); // jsonId  → dbId
  const dishIdMap = new Map(); // jsonDishId → dbDishId

  console.log("\nInserting restaurants and dishes…");
  for (const r of restaurants) {
    const { data: rRow, error: rErr } = await supabase
      .from("restaurants")
      .insert({
        name: r.name,
        description: r.description ?? "",
        rating: r.rating ?? 0,
        tags: r.tags ?? [],
      })
      .select()
      .single();
    if (rErr) throw new Error(`Insert ${r.name}: ${rErr.message}`);

    restaurantIdMap.set(r.id, rRow.id);

    if (Array.isArray(r.dishes) && r.dishes.length > 0) {
      // Insert dishes one at a time so we can map old→new dish ids.
      for (const d of r.dishes) {
        const { data: dRow, error: dErr } = await supabase
          .from("dishes")
          .insert({
            restaurant_id: rRow.id,
            name: d.name,
            price: d.price,
          })
          .select()
          .single();
        if (dErr)
          throw new Error(`Insert dish ${d.name}: ${dErr.message}`);
        dishIdMap.set(d.id, dRow.id);
      }
    }

    console.log(
      `  ✓ ${r.name.padEnd(20)} (${(r.dishes || []).length} dishes)`
    );
  }

  console.log("\nInserting users…");
  for (const u of users) {
    const dbRestaurantId =
      u.restaurant_id != null
        ? restaurantIdMap.get(u.restaurant_id) ?? null
        : null;

    const { error } = await supabase.from("users").insert({
      email: u.email,
      password_hash: u.password, // already bcrypt hashed
      role: u.role,
      restaurant_id: dbRestaurantId,
    });
    if (error) throw new Error(`Insert ${u.email}: ${error.message}`);

    const tag =
      u.role === "restaurant"
        ? ` (manages: ${
            restaurants.find((r) => r.id === u.restaurant_id)?.name ?? "?"
          })`
        : "";
    console.log(`  ✓ ${u.email}${tag}`);
  }

  // Optional: a couple of fake orders so the demo has data
  console.log("\nInserting a couple of fake orders…");

  // Look up the customer user we just inserted
  const { data: customerRow } = await supabase
    .from("users")
    .select("id")
    .eq("email", "customer@mail.com")
    .single();

  if (customerRow) {
    const firstRestaurantId = restaurantIdMap.get(1); // Pizza Palace
    const dishOldIds = [10, 11]; // 2× Pepperoni, 1× Margherita

    const { data: orderRow } = await supabase
      .from("orders")
      .insert({
        customer_id: customerRow.id,
        restaurant_id: firstRestaurantId,
        status: "preparing",
      })
      .select()
      .single();

    if (orderRow) {
      const items = [
        { dish_id: dishIdMap.get(10), quantity: 2, unit_price: 9.99 },
        { dish_id: dishIdMap.get(11), quantity: 1, unit_price: 8.5 },
      ].map((row) => ({ ...row, order_id: orderRow.id }));
      await supabase.from("order_items").insert(items);
      console.log("  ✓ fake order #1 (status: preparing)");
    }
  }

  console.log("\n✅ Seed complete.");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
