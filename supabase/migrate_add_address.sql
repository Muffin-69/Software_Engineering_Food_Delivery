-- Non-destructive migration for the new "address" column.
-- Run this in the Supabase SQL Editor if you want to keep your
-- existing data instead of re-running schema.sql + npm run seed.

ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
