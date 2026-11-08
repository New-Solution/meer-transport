# MeerTransport

A multi-tenant truck transportation management SaaS, built with Laravel 12,
Inertia.js, React 19, and MySQL.

## Documentation

See the [`docs/`](docs) folder for full project documentation:

- [`docs/PRD.md`](docs/PRD.md) — product requirements, roles, and feature list
- [`docs/TRD.md`](docs/TRD.md) — tech stack and architecture decisions
- [`docs/schema.md`](docs/schema.md) — database schema
- [`docs/AppFlow.md`](docs/AppFlow.md) — user flows and lifecycles
- [`docs/UI_spec.md`](docs/UI_spec.md) — page map and UI conventions
- [`docs/plan.md`](docs/plan.md) — build order and current status

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

## Running locally

```bash
composer run dev
```

This starts the Laravel server, the queue worker, and the Vite dev server
together. Then open `http://localhost:8000`.

## Testing & quality

```bash
php artisan test            # backend tests
vendor/bin/phpstan analyse  # static analysis
vendor/bin/pint             # code style
npm run check:fix           # frontend lint/format
npm run types:check         # TypeScript
```
