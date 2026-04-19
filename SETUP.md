# Ascendly — Getting Started

## Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a cloud Postgres URL)

## 1. Database

Create a PostgreSQL database called `ascendly`, then update `server/.env`:

```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/ascendly"
```

## 2. Run Migrations + Seed

```bash
cd server
npx prisma migrate dev --name init
node prisma/seed.js
```

## 3. Dev (both processes)

From the repo root:

```bash
npm run dev
```

Or separately:

```bash
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

## 4. Deploy

- **Backend → Render**: connect repo, point root dir to `server/`, use `render.yaml`
- **Frontend → Vercel**: connect repo, point root dir to `client/`, framework = Vite

Set these env vars on Render:
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (strong random strings)
- `CLIENT_ORIGIN` = your Vercel URL
- `DATABASE_URL` = Render PostgreSQL connection string

Set on Vercel:
- `VITE_API_URL` is not needed — Vite proxy handles dev, Vercel rewrites handle prod (API calls go to `/api/*`)

> Update `client/vite.config.js` proxy target and `render.yaml` CLIENT_ORIGIN with real URLs before deploying.
