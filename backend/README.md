# CyberShield AI — Backend

Express.js + Prisma + Neon PostgreSQL backend for the CyberShield AI platform.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js 5
- **ORM:** Prisma 6
- **Database:** Neon PostgreSQL (serverless)
- **Auth:** JWT + bcrypt + refresh tokens

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Neon credentials:

```bash
cp .env.example .env
```

Get your connection strings from the [Neon Console](https://console.neon.tech):
- **DATABASE_URL** — Use the **pooled** connection string (contains `-pooler` in the hostname)
- **DIRECT_URL** — Use the **direct** connection string (no `-pooler`) — required for migrations

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed the database

```bash
npx prisma db seed
```

### 6. Start development server

```bash
npm run dev
```

Server starts at `http://localhost:4000`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `DIRECT_URL` | ✅ (migrations) | Neon direct connection string |
| `JWT_SECRET` | ✅ | Min 16 chars, used for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Min 16 chars, used for refresh tokens |
| `PORT` | ❌ | Server port (default: 4000) |
| `NODE_ENV` | ❌ | development / production / test |
| `CORS_ORIGIN` | ❌ | Frontend URL (default: http://localhost:3000) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Run compiled production build |
| `npx prisma generate` | Generate Prisma Client types |
| `npx prisma migrate dev` | Create and apply migrations |
| `npx prisma db seed` | Seed database with test data |
| `npx prisma studio` | Open Prisma Studio GUI |

## API Endpoints

Base URL: `/api/v1`

### Health
- `GET /api/v1/health` — Server and database status

### Authentication
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Sign in
- `POST /api/v1/auth/logout` — Sign out
- `POST /api/v1/auth/refresh` — Refresh access token
- `GET /api/v1/auth/me` — Get current user (protected)

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@cybershield.in | password123 |
| Police | officer@cybershield.in | password123 |
| Organization | admin@techcorp.in | password123 |

## Architecture

```
src/
├── config/         # Environment, database connection
├── routes/         # Express routers
├── middlewares/    # Error handler, validation, auth
├── modules/       # Feature modules (auth, citizen, scanner, etc.)
│   └── auth/      # Repository → Service → Controller → Routes
├── utils/         # Response helpers, error classes
├── types/         # Shared TypeScript types
└── index.ts       # Server entry point
```

## Deployment

The backend is designed for deployment to any Node.js hosting (Railway, Render, Fly.io, etc.) with the Neon database connection string provided via environment variables.
