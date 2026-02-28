# AGENTS.md

## Cursor Cloud specific instructions

This is **Diário de Bordo** — a React web app for Brazilian truck drivers to track freight trips, expenses, and fuel consumption. Authentication and user profiles are stored in **Supabase**; trip/expense/fuel data is still in browser `localStorage`.

### Tech stack

Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + React Router v6. See `package.json` for scripts.

### Running the app

- `npm run dev` — starts Vite dev server on **port 8080**
- `npm run build` — production build
- `npm run lint` — ESLint (pre-existing warnings from shadcn/ui boilerplate; exit code 1 is expected)
- `npm run test` — Vitest (jsdom environment)

### Notes

- The lint command exits with code 1 due to pre-existing errors in generated shadcn/ui components (`@typescript-eslint/no-empty-object-type` in `command.tsx`/`textarea.tsx`, `@typescript-eslint/no-require-imports` in `tailwind.config.ts`). These are not regressions.
- The app is entirely in Portuguese (Brazilian). UI labels, buttons, and navigation are in Portuguese.
- **Supabase is required**: the app needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars (see `.env.example`). Without them, the dev server starts but the app shows an error. For local dev, pass them inline or create a `.env` file.
- A `profiles` table must exist in Supabase — see `supabase_setup.sql` for the schema and RLS policies.
