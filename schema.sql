-- Tap-to-Skip schema. Paste this whole file into the Supabase SQL editor and run it.

create table if not exists skips (
  id uuid default gen_random_uuid() primary key,
  resident_id text,
  resident_name text,
  room text,
  meal text check (meal in ('breakfast', 'lunch', 'dinner')),
  meal_date date,
  created_at timestamptz default now(),
  unique (resident_id, meal, meal_date)
);

alter table skips enable row level security;

-- DEMO ONLY: these policies let anyone with the anon key read, add and delete skips.
-- That is fine for a pitch demo with fake residents; a real deployment needs real auth.
drop policy if exists "anon select" on skips;
drop policy if exists "anon insert" on skips;
drop policy if exists "anon delete" on skips;
create policy "anon select" on skips for select to anon using (true);
create policy "anon insert" on skips for insert to anon with check (true);
create policy "anon delete" on skips for delete to anon using (true);

-- Realtime (re-running this line errors with "already member of publication"; that is harmless).
alter publication supabase_realtime add table skips;
