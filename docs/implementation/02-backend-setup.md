# 02 - Backend Setup

## Prerequisites

- Node.js 20+
- pnpm or npm
- Docker and Docker Compose (optional, for local PostgreSQL)
- PostgreSQL 15+ (local or managed)

## Nest.js Bootstrap

1. Create Nest app at repo root:

   ```bash
   cd backend
   npx @nestjs/cli new . --package-manager pnpm
   ```

   Or scaffold manually: `package.json` with `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, and add `nest-cli.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`.

2. Install core dependencies:

   ```bash
   pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/throttler
   pnpm add @prisma/client
   pnpm add -D prisma @types/passport-jwt @types/bcrypt
   ```

3. **Environment variables:** Use `@nestjs/config` with `ConfigModule.forRoot({ isGlobal: true })`. Required env vars (see `.env.example` below).

## Prisma + PostgreSQL

1. Initialize Prisma:

   ```bash
   npx prisma init
   ```

2. Set `DATABASE_URL` in `.env`:

   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/nexuswait?schema=public"
   ```

3. Schema lives in `prisma/schema.prisma`. After defining models (see 03-domain-and-database.md):

   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Provide `PrismaService` (or a wrapper) in a global module and inject it into repository classes. Use a single `PrismaService` that extends `PrismaClient` and is used by all infrastructure repositories.

## Docker Compose (Local DB)

Create `backend/docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: nexuswait
      POSTGRES_PASSWORD: nexuswait
      POSTGRES_DB: nexuswait
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

- Start: `docker compose up -d`
- Use `DATABASE_URL=postgresql://nexuswait:nexuswait@localhost:5432/nexuswait`

Redis is optional; use it if you adopt Bull/BullMQ for the notification queue.

## Environment Variables

Create `backend/.env.example`:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/nexuswait?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# API
PORT=3000
API_PREFIX=v1

# Polar.sh
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRODUCT_ID_SPARK=
POLAR_PRODUCT_ID_PULSE=
POLAR_PRODUCT_ID_NEXUS=

# App URL (for checkout redirects, webhooks)
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

Copy to `.env` and fill values. Do not commit `.env`.

## Health Check

- Add a health endpoint for readiness/liveness (e.g. `GET /health` or `GET /v1/health`).
- Use `@nestjs/terminus` with `PrismaHealthIndicator`: check DB connection. Optional: Redis health if used.

Example:

```ts
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private health: HealthCheckService, private prisma: PrismaHealthIndicator) {}
  @Get()
  check() {
    return this.health.check([() => this.prisma.pingCheck('db', this.prisma)]);
  }
}
```

## Running the Backend

- Development: `pnpm run start:dev` (watch mode).
- Build: `pnpm run build`.
- Start production: `node dist/main`.

## Summary

- Nest app with ConfigModule, Prisma, and env-based config.
- PostgreSQL via Prisma; optional Docker Compose for local DB (and Redis).
- Health check that includes DB (and optionally Redis).
- All secrets and environment-specific values in `.env`; document in `.env.example`.
