# Tests

## Node tests (no network)
```
npm run test:node      # schema + routes + logic
```
- `schema.test.mjs` — discovery-output & blueprint JSON-schema accept/reject (draft 2020-12).
- `routes.test.mjs` — all expected app routes are registered.
- `logic.test.mjs` — AI provider resolution + Builder request validation (bundled from the edge modules with esbuild).

Requires devDeps already in package.json: `ajv`, `ajv-formats`, `esbuild` (via vite).

## Database tests (ephemeral Postgres, no network, no remote project)
```
pip install pgserver "psycopg[binary]" --break-system-packages
npm run test:db
```
Each harness spins up a throwaway Postgres, stubs the Supabase `auth` schema +
roles, applies **all** migrations in order, and asserts:
- `foundation.py` — tables, FKs, indexes, RLS, 3-product limit, cross-user isolation.
- `discovery.py` — anon session/answers/resume, authed RLS, ai_runs audit.
- `blueprint_paywall.py` — opportunity selection, blueprint persistence, product
  association, duplicate-prevention, 3-limit, entitlement, purchases write-guard.
- `builder.py` — entitlement gate, DB-level builder_state write-guard, context
  load, state persist/resume, product isolation, ai_run↔product, tools RLS.

> These validate the SQL + policies locally. They are NOT a remote deployment.
