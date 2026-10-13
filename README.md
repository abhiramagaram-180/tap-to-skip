# Tap-to-Skip

A one-tap way for hostel students to opt out of a meal before cutoff, so the mess cooks for the real headcount instead of everyone. Half of what's saved on ingredients comes back to students as credit on next month's bill.

![student view placeholder](docs/screenshot-student.png)
![mess view placeholder](docs/screenshot-mess.png)

## How it works

- Students pick their name (demo roster) and tap "Skip" on breakfast/lunch/dinner before that meal's cutoff; the toggle locks after the cutoff.
- The mess screen shows live headcounts per meal — `Cook for = (residents − skips) + 5% buffer`, updating in real time as students skip.
- Ingredients not bought for skipped plates (₹25/plate) are split 50% back to students as credit, 35% to the mess, 15% to Tap-to-Skip; a ledger tracks each student's monthly credit (₹12.50/skip).

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL editor in that project and run all of [`schema.sql`](schema.sql).
3. Copy your Project URL and `anon` public key (Project Settings → API) into [`config.js`](config.js).
4. Push this repo to GitHub, then in **Settings → Pages** set Source to "Deploy from a branch", branch `main`, folder `/root`.
5. Without a Supabase config, the app runs in **demo mode** automatically (localStorage, synced across browser tabs only).

## The numbers, and where they came from

- **₹25 per meal** — estimated ingredient cost per plate, derived from IIT Kanpur's reported raw-material mess cost of ₹70–80 per student per day (a day = breakfast + lunch + dinner).
- **₹12.50 credit per skip** — 50% of the ₹25 ingredient saving per skipped plate, returned to the student.
- **5% buffer** on headcount — a safety margin so the mess doesn't under-cook.
- **50 / 35 / 15 split** — 50% of savings to students (credit), 35% to the mess (its own saving), 15% modeled as a platform fee for Tap-to-Skip.

All resident names, rooms, and skip history shown in the app are **demo data, not real students**.

## Team ZeroPlate

Amudan Desikan · Abhiram Agaram (PES1UG25CS017) · Ishaan Bhatia · Abhinav Rao · Cetas Hegde · Akash

Built for CIE Spark 2026, PES University.
