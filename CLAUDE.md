# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lifestyle Medicine & Gospel Medical Evangelism Knowledge Platform — a web app for managing treatment protocols based on NEWSTART+ health principles with integrated Bible/spiritual guidance.

## Tech Stack

- **Backend**: Laravel 12, PHP 8.2+, MySQL (SQLite for local/tests), Sanctum auth, Fortify
- **Frontend**: Two separate React 19 apps:
  - `resources/js/` — Inertia.js SSR app (Vite + Tailwind CSS 4 + React Compiler)
  - `admin-dashboard/` — Standalone SPA (Vite + Tailwind CSS 3 + React Router 7 + Axios)
- **AI**: Google Gemini 2.5-flash (content generation), Vertex AI Imagen (infographics)
- **Queue**: Database driver with jobs table

## Common Commands

### Development
```bash
composer run dev          # Runs Laravel server + queue listener + Vite concurrently
```

### Backend
```bash
php artisan test                    # Run all tests
php artisan test --filter=ClassName # Run a single test class
./vendor/bin/phpunit                # Alternative test runner
composer lint                       # Laravel Pint (PSR-12 via laravel preset)
composer test:lint                  # Check style without fixing
php artisan migrate                 # Run migrations
php artisan db:seed --class=CareDomainSeeder  # Seed care domains
php artisan queue:listen --tries=1  # Process queue jobs
```

### Frontend (admin-dashboard/)
```bash
cd admin-dashboard
npm run dev           # Vite dev server (:5173)
npm run build         # Production build
npm run lint          # ESLint fix
npm run format        # Prettier fix
npm run format:check  # Check formatting
```

### Frontend (resources/ Inertia app)
```bash
npm run dev           # Vite dev server
npm run build         # Production build
npm run types         # TypeScript type check
```

## Architecture

### Two Frontend Apps
The project has two distinct frontends:
1. **Inertia app** (`resources/js/`) — uses TypeScript, SSR, React Compiler, Wayfinder for routes
2. **Admin dashboard** (`admin-dashboard/src/`) — standalone React SPA with feature-based organization under `features/`, communicates via REST API at `/api/v1/`

### Backend Layers
- **Controllers** (`app/Http/Controllers/Api/`) — API endpoints, all under `/api/v1/` prefix
- **Services** (`app/Services/`) — business logic: `GeminiService`, `AiContentService`, `BibleApiService`, `ImagenService`, `InfographicGeneratorService`
- **Jobs** (`app/Jobs/`) — async processing: `GenerateAiDraftJob`, `StructureAiContentJob`, `GenerateInfographicJob`
- **Actions** (`app/Actions/`) — single-responsibility operation classes
- **Resources** (`app/Http/Resources/`) — API response transformation

### API Route Structure
Routes in `routes/api.php`:
- **Public** (rate-limited 60/min): read-only endpoints for conditions, interventions, care-domains, scriptures, recipes, search, bible, knowledge-graph
- **Admin** (Sanctum-authenticated): CRUD operations, imports, exports, AI generation, analytics

### Admin Dashboard Frontend Organization
```
admin-dashboard/src/
├── contexts/        # AuthContext (token + 30min timeout), NotificationContext
├── features/        # Feature modules (conditions, interventions, ai-generator, knowledge-graph, etc.)
├── components/      # Shared: layout/, shared/, relationships/, ui/, editor/, skeleton/
├── lib/api.js       # Axios client (base URL, interceptors, auth headers)
└── lib/swal.js      # SweetAlert2 toast helpers
```

## Critical Patterns

### UUID vs Auto-increment
Most models use UUID primary keys (`HasUuids` trait), but **`User` uses auto-increment `$table->id()`**. Foreign keys to `users` must use `foreignId()`, NOT `foreignUuid()`.

### Model Traits
Models commonly use these traits:
- `HasUuids` — UUID primary keys (not on User)
- `HasAuditFields` — tracks `created_by`, `updated_by`, `deleted_by` (all `foreignId` to users)
- `HasMedia` — polymorphic media relationships
- `HasPublishingStatus` — publishing workflow
- `HasRevisions` — content version control
- `SoftDeletes` — soft deletion

### Queue Jobs Pattern
Jobs implement: `Dispatchable`, `InteractsWithQueue`, `Queueable`, `SerializesModels` with `$tries`, `$timeout`, `$backoff` properties.

### User Roles
Three roles stored in `role` column: `admin`, `editor`, `viewer`. Helper methods: `isAdmin()`, `isEditor()`, `isViewer()`, `canEdit()` (true for admin/editor).

## Testing

- PHPUnit with SQLite in-memory (`:memory:`) — see `phpunit.xml`
- **MySQL-only syntax** (e.g., `MODIFY COLUMN ENUM`) must be guarded with `DB::getDriverName() === 'mysql'`
- Known pre-existing failure: `ProfileUpdateTest::user_can_delete_their_account` (soft delete vs hard delete assertion)
- Queue uses `sync` driver in tests

## Linting & Formatting

- **PHP**: Laravel Pint with `laravel` preset (PSR-12) — config in `pint.json`
- **JS**: ESLint 9 with React/hooks/import plugins — config in `eslint.config.js`
- **Prettier**: semi, singleQuote, tabWidth 4, plugins for import sorting and Tailwind class sorting — config in `.prettierrc`

## Deployment

- **API**: https://api.rindra.org — HestiaCP VPS
- **Dashboard**: https://lifestyle.rindra.org
- Deploy scripts in `scripts/` — `deploy-hestia.sh` (VPS), `remote-deploy-hestia.bat` (Windows trigger)
- CI: GitHub Actions for tests (PHP 8.4/8.5 matrix) and linting on push/PR to main/develop
