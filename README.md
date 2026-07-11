# ERP Smart

AI-powered SaaS ERP platform for small and medium businesses.

## Monorepo Structure

```
ERP-SaaS-Project/
├── apps/
│   ├── web/          # Main ERP application (port 3000)
│   ├── marketing/    # Public marketing site (port 3001)
│   └── api/          # NestJS backend (port 4000)
├── packages/
│   ├── ui/           # Shared shadcn/ui components
│   ├── i18n/         # Arabic/English translations + RTL
│   └── types/        # Shared TypeScript types
├── database/
│   └── prisma/       # Database schema and migrations
├── docs/             # Project documentation
└── tests/
    └── e2e/          # Playwright end-to-end tests
```

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS, Prisma ORM
- **Database:** PostgreSQL
- **i18n:** Arabic + English with RTL support

## Prerequisites

- Node.js >= 20
- Docker Desktop (for local PostgreSQL)
- npm

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure environment

Copy `.env.example` files in each app and set values:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/marketing/.env.example apps/marketing/.env
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start development servers

```bash
npm run dev
```

| App       | URL                     |
|-----------|-------------------------|
| Web       | http://localhost:3000   |
| Marketing | http://localhost:3001   |
| API       | http://localhost:4000   |

## Scripts

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm run dev`        | Start all apps                 |
| `npm run dev:web`    | Start main app only            |
| `npm run dev:marketing` | Start marketing site only   |
| `npm run dev:api`    | Start API only                 |
| `npm run build`      | Build all apps                 |
| `npm run test`       | Run all tests                  |
| `npm run db:migrate` | Run Prisma migrations          |
| `npm run db:studio`  | Open Prisma Studio             |

## Documentation

All project documentation is in the [`docs/`](./docs/) folder.

## Phase 1 Status

Project foundation — empty but working application scaffold. No business features yet.
