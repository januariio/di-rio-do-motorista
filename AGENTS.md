# AGENTS.md

## Cursor Cloud specific instructions

This is **Diário de Bordo** — a client-side-only React web app for Brazilian truck drivers to track freight trips, expenses, and fuel consumption. All data is stored in browser `localStorage`; there is no backend or database.

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
- No environment variables, secrets, or external services are required.
