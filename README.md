# Daily Expense Tracker

Next.js + optional Supabase (Postgres, Auth, RLS). Money is stored as integer pence. “Today” uses Europe/London.

## Run locally (no cloud required)

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, then add expenses. Data is stored in `.data/db.json`.

## Optional: Supabase

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Restart `npm run dev`. Auth and expenses then use Supabase instead of the local file.

## Scripts

- `npm run lint` — type-check
- `npm test` — Vitest
# money-expense-tracker
# expense-tracker
