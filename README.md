# StockPilot

StockPilot is an inventory and order management project built in phases. **Phase 2 currently provides the project foundation only:** a React/Vite client, Express API, PostgreSQL schema, migrations, a local database configuration, and a database connection check. Product, order, authentication, and dashboard workflows are planned for later phases.

## Requirements

- Node.js 22.12+ (this project uses Node.js 22 features)
- npm
- Docker Desktop with the Linux engine, or a separately running PostgreSQL 17+

## Local setup

1. Copy `.env.example` to `.env` in this directory. Set a long, local-only database password. The password in `DATABASE_URL` must match `POSTGRES_PASSWORD` (URL-encode special characters if needed). Set `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` of at least 16 characters.
2. Run `npm install`.
3. Run `npm run db:up` to start PostgreSQL in Docker. If you already have PostgreSQL, configure `DATABASE_URL` instead.
4. Run `npm run db:migrate` and `npm run db:check`.
5. Run `npm run db:seed` to create the initial admin account. Running it again leaves that account unchanged.
6. In one terminal run `npm run dev:server`; in another run `npm run dev:client`.
7. Open `http://localhost:5173`. The three setup cards should show that the client, API, and database are ready.

The client sends `/api` requests through Vite's local proxy to the API on port 4000. In production, deployment routing and cookie settings will be configured and verified in Phase 8.

## Useful checks

- `npm run build` — build the client
- `npm run lint` — run ESLint
- `npm test` — check that the API reaches the migrated local database
- `npm run db:check` — test the database connection and migration count
- `http://localhost:4000/api/health` — API and database health response

The `.env` file and `node_modules` are ignored by Git. The tracked `.env.example` contains placeholders only. SQL schema details and the ER diagram are in `docs/schema.md`.

## Architecture

The intended request path is **React UI → Express route → controller → service → repository → PostgreSQL**. Routes choose handlers; controllers handle HTTP input/output; services own business rules and transactions; repositories use parameterized SQL. The foundation includes the database configuration and health route. Feature layers will be added as each phase begins.
