# Kingdom of Chess API

NestJS API for the Kingdom of Chess application. The API uses PostgreSQL and Drizzle ORM.

## Run with Docker Compose

Requirements: Docker Desktop (or Docker Engine) with the Compose plugin.

1. Copy `.env.docker.example` to `.env.docker`.
2. Set `POSTGRES_PASSWORD` and `JWT_SECRET` to separate, strong random values. Keep the PostgreSQL password URL-safe (letters and numbers are recommended).
3. Start the stack from this directory:

```bash
docker compose --env-file .env.docker up --build -d
```

Compose starts PostgreSQL, waits for its health check, applies the Drizzle migrations, then starts the API. PostgreSQL data is persisted in the `postgres_data` volume. The API runs as the unprivileged `node` user and exposes port `3000` by default.

- API: `http://localhost:3000/api/v1`
- Health check: `http://localhost:3000/api/v1/health`
- Swagger: `http://localhost:3000/api/docs`

Set `API_PORT` in `.env.docker` to change the host port. Set `FRONTEND_URL` to the frontend's origin so browser and Socket.IO requests pass CORS checks.

Useful commands:

```bash
docker compose --env-file .env.docker logs -f api
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker down
```

`down` keeps the database volume. To permanently delete the database data as well, run `docker compose --env-file .env.docker down -v`.

## Run locally without Docker

```bash
npm ci
npm run start:dev
```

The API requires `DATABASE_URL` and a `JWT_SECRET` of at least 10 characters. `PORT` defaults to `3000`; `FRONTEND_URL` defaults to `http://localhost:5173`.

## Database migrations

Generate a migration after changing the Drizzle schema:

```bash
npm run db:generate
```

Apply pending migrations manually when running outside Compose:

```bash
npm run db:migrate
```

Compose runs migrations automatically before starting the API.
