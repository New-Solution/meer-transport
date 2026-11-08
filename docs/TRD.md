# MeerTransport — Technical Requirements Document (TRD)

## 1. Stack

| Layer                | Choice                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend framework    | Laravel 12                                                                                                                                  |
| Frontend framework   | React 19 + TypeScript (unchanged from the original demo)                                                                                    |
| Glue between them    | Inertia.js v3 — lets Laravel render React pages directly, no separate REST/JSON API to build or maintain                                    |
| Styling / components | Tailwind CSS + shadcn/ui                                                                                                                    |
| Build tool           | Vite, via `@laravel/vite-plugin-wayfinder` (generates typed route helpers used from React — see §5)                                         |
| Database             | MySQL (via XAMPP locally)                                                                                                                   |
| Starting point       | `laravel/react-starter-kit` (official Laravel starter), which already provided auth, multi-company account structure, and the base UI shell |

## 2. Multi-tenancy — how data isolation is enforced

Every company-owned table (customers, contracts, trucks, drivers,
destinations, transport orders, etc.) has a `company_id` column. Isolation is
enforced at the **Eloquent model layer**, not just in controllers, so it can't
be bypassed by mistake:

- `App\Models\Concerns\BelongsToCompany` (trait) + `App\Models\Scopes\CompanyScope`
  (global scope) — automatically:
    - filters every query for that model to the current user's company, and
    - fills in `company_id` automatically when creating a new record.
- This scope is skipped only when there's no authenticated user (e.g. in
  tests setting up fixtures directly), never in normal request handling.
- Every Policy additionally re-checks `record->company_id === user->current_company_id`
  as defense-in-depth, so even a guessed/forged URL ID from another company
  can't be acted on.

## 3. Two separate authorization systems (on purpose)

The starter kit came with its own **account-level** role system
(`CompanyRole`: Owner / Admin / Member + `CompanyPermission`) for things like
inviting members, renaming the company, or deleting it.

We added a second, independent **business/operational** role system on top,
specific to trucking operations:

- `App\Enums\BusinessRole` — Admin / Operations Manager / Dispatcher / Viewer
- `App\Enums\BusinessPermission` — 28 fine-grained permissions (e.g.
  `contracts:edit`, `orders:cancel`, `pricing:manage`, `reports:view`)
- Stored in `company_members.business_role`
- Exposed on the `User` model via `App\Concerns\HasBusinessRole`
  (`hasBusinessPermission()`)
- Enforced through Laravel **Policies** (one per domain model, e.g.
  `ContractPolicy`, `TransportOrderPolicy`) plus two small `Gate::define()`
  closures for the two pages that aren't backed by a single model
  (Pricing, Reports — see `AppServiceProvider::configureBusinessGates()`).

These two systems are kept deliberately separate (not merged into one field)
because they answer different questions: "can this person manage the
company's account?" vs. "what can this person do with trucks and orders?".

## 4. Code organization pattern

To keep business logic out of controllers ("no spaghetti, no tight
coupling," per the build brief):

- **Controllers** are thin: authorize, delegate to an Action, redirect/render.
- **Action classes** (`app/Actions/{Domain}/...`) hold multi-step business
  logic (e.g. `CreateContract`, `ConfirmTransportOrder`, `CancelContract`).
  They throw a plain `RuntimeException` for state-transition violations
  (e.g. "only DRAFT contracts can be activated"), which the controller
  catches and turns into a flash-toast error.
- **Form Requests** handle validation; `authorize()` delegates to the
  relevant Policy, and cross-field business validation lives in
  `withValidator()`. Shared validation logic between Store/Update requests is
  extracted into traits (e.g. `ValidatesContractRoutes`,
  `ValidatesTransportOrder`) to avoid duplicating rules.
- **Policies** are the single source of truth for "can this user do X to this
  record", used from both controllers (`Gate::authorize(...)`) and the
  Inertia-rendered pages (e.g. `canOverridePrice` flag sent to the frontend).

## 5. Frontend conventions

- Pages live in `resources/js/pages/{module}/*.tsx` (index, form, show —
  mirroring whichever of those the backend resource route actually exposes).
- Route URLs are never hand-typed in React. `@laravel/vite-plugin-wayfinder`
  generates typed helper functions from the Laravel routes
  (`resources/js/routes/**`, gitignored, regenerated on `npm run build` or
  `npm run dev`). Example: `show({ current_company: slug, contract: id })`.
- Shared TypeScript types live in `resources/js/types/*.ts`, one file per
  domain, re-exported from `resources/js/types/index.ts`.
- UI components are shadcn/ui primitives (`Card`, `Badge`, `Select`,
  `DropdownMenu`, `Dialog`, etc.) styled with Tailwind.

## 6. Data modeling choices worth knowing about

- **Money** is stored as integer halalas (1 SAR = 100 halalas) everywhere in
  the database and business logic, converted to/from decimal SAR only at the
  UI boundary (`App\Support\Money`). This avoids floating-point rounding
  bugs in financial calculations.
- **Snapshots**: a Contract stores a `customer_snapshot` JSON column; a
  Transport Order stores `customer_snapshot`, `contract_snapshot`, and
  `route_snapshot` JSON columns. This means if a customer's address changes
  or a contract's price changes later, old contracts/orders still show
  exactly what was agreed at the time — important for historical accuracy
  and audits.
- **Contract status is computed, not stored-and-cron'd.** A contract's
  `status` column only ever holds what was explicitly set (DRAFT, ACTIVE,
  CANCELLED). Whether an ACTIVE contract has actually expired is computed on
  the fly by `Contract::resolvedStatus()` by comparing today's date to the
  expiry date — no scheduled job needed to "expire" contracts.

## 7. Known framework gotcha (standing rule in this codebase)

When a controller method sits under a nested route like
`{current_company}/destinations/{destination}`, **every** route-bound model
in the URL must be declared as a parameter, in URL order — even ones the
method body doesn't use — e.g.:

```php
public function destroy(Company $current_company, Destination $destination)
```

Omitting an earlier one (e.g. just `destroy(Destination $destination)`)
causes Laravel to silently misassign route parameters to the wrong argument.

## 8. Testing & quality tooling

| Tool                               | Purpose                           | Command                      |
| ---------------------------------- | --------------------------------- | ---------------------------- |
| Pest/PHPUnit                       | Feature tests (230 at last count) | `php artisan test`           |
| Larastan (PHPStan)                 | Static analysis for PHP           | `vendor/bin/phpstan analyse` |
| Laravel Pint                       | PHP code style                    | `vendor/bin/pint`            |
| ESLint + Prettier (via `vp check`) | Frontend lint/format              | `npm run check:fix`          |
| TypeScript                         | Type checking                     | `npm run types:check`        |

Notable Larastan/PHP patterns used throughout to keep static analysis clean:

- `Model::query()->whereKey($id)->firstOrFail()` instead of `findOrFail($id)`
  (the latter has an ambiguous `Model|Collection` return type in Larastan's
  stubs).
- Date parameters typed as `?Carbon\CarbonInterface` rather than
  `?Illuminate\Support\Carbon`, since Laravel 11+ casts dates to
  `CarbonImmutable` by default.

## 9. Local environment

- PHP 8.4+ and Composer (via Herd or any local install)
- Node.js + npm (for Vite/React)
- MySQL (via XAMPP locally)

One-time setup on a fresh machine:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

Day-to-day, one command starts everything (Laravel server + queue worker +
Vite dev server with hot reload):

```bash
composer run dev
```

Then open `http://localhost:8000`.
