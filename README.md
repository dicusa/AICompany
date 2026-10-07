# AICompany

Multi-tenant business management platform starter. The repository was initially empty; this implementation provides a polished React dashboard, versioned REST API, PostgreSQL tenant isolation schema, authentication primitives, and automated tests.

## Run locally

Requirements: Node.js 20+, npm, and PostgreSQL 15+.

```sh
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

The UI is served at `http://localhost:5173`; API at `http://localhost:3000/api/v1`. Set `DATABASE_URL` and a random `JWT_SECRET` in `.env`. `npm run dev` starts the API and Vite frontend together.

## API

`POST /api/v1/auth/register` accepts `{name,email,password,company}` and creates a tenant admin. It returns the tenant UUID needed by `POST /api/v1/auth/login`, which accepts `{tenantId,email,password}` and returns a signed bearer token. Authenticated `/api/v1/{customers,products,orders,payments,inventory,employees,operations}` endpoints support GET and POST; `/api/v1/analytics` provides tenant-scoped counts. All requests use `Authorization: Bearer <token>`. The API applies tenant context for each transaction; PostgreSQL RLS policies are enabled as a second isolation layer. Errors use `{error:{code,message,requestId}}`.

## Operations

- `npm test` runs service and API tests; `npm run build` type-checks and builds the frontend.
- `npm run db:migrate` applies ordered SQL migrations.
- `docker compose up --build` starts PostgreSQL, API, and web services.
- Configure backups and restore drills for PostgreSQL, TLS termination, managed secrets, and monitoring before production. `/health` reports service readiness.

See [docs/api.md](docs/api.md) for API details and [docs/runbook.md](docs/runbook.md) for deployment and incident procedures. The AI assistant currently provides a transparent, local planning helper and does not send business data to an external model.
