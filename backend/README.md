# NexusWait Backend

Nest.js API with Prisma and PostgreSQL. See `docs/implementation/` for architecture and API specs.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, etc.  
   Default `DATABASE_URL` matches `docker-compose.yml` (Postgres on host port **5433** to avoid conflict with local Postgres on 5432):  
   `postgresql://nexuswait:nexuswait@localhost:5433/nexuswait?schema=public`

2. **Start PostgreSQL first** (required before migrations):
   ```bash
   docker compose up -d postgres
   ```
   Or: `npm run db:up`

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
   Or: `npm run db:migrate`

4. Install and run the API:
   ```bash
   npm install && npm run start:dev
   ```

### If you see `P1010: User was denied access on the database`

- **PostgreSQL is not running.** Start it with `npm run db:up`, wait ~5 seconds, then run `npm run db:migrate` again.
- **Stale Docker volume.** If the Postgres container was first created with different credentials, the volume may have the old user. Reset the database and recreate:
  ```bash
  npm run db:reset
  ```
  Wait ~5 seconds for Postgres to be ready, then run `npm run db:migrate`.
- Ensure `.env` in the `backend` folder has:
  `DATABASE_URL="postgresql://nexuswait:nexuswait@localhost:5433/nexuswait?schema=public"` (must match `docker-compose.yml`: user `nexuswait`, password `nexuswait`, database `nexuswait`).
- If you use a different Postgres (e.g. system install), create a database named `nexuswait` and a user with access, then set `DATABASE_URL` accordingly.

## Health

- `GET /v1/health` – health check (DB connectivity).

## API (v1)

- Auth: `POST /v1/auth/register`, `POST /v1/auth/login`, `GET /v1/auth/me`
- Projects: `GET/POST /v1/projects`, `GET/PATCH/DELETE /v1/projects/:id`
- Subscribers: `POST /v1/projects/:id/subscribers`, `GET /v1/projects/:id/subscribers`, `GET /v1/projects/:id/subscribers/count`, `GET /v1/projects/:id/subscribers/:subId`

All project/subscriber endpoints require JWT (Bearer token) except `POST subscribers` and `GET subscribers/count` which can support publishable key later.
