# MeerTransport — Build Plan

## Origin

Boss sent the original React/Dexie demo + 3 requirements: Laravel backend,
same frontend, MySQL/PostgreSQL database. We discussed architecture before
writing any code, then built module by module, each one fully tested
(automated tests + manual browser walkthrough) before moving to the next.

## Decisions made before building (see [PRD.md](PRD.md) / [TRD.md](TRD.md) for detail)

- Laravel 12 + Inertia.js + React (kept) + MySQL
- Built on top of `laravel/react-starter-kit` rather than from scratch, to
  reuse its auth, multi-company account scaffolding, and base UI shell
- Multi-tenant SaaS from day one (not literally asked for, but the original
  demo's data model needed it and retrofitting later would be far more
  expensive)
- Clean architecture standing rules: thin controllers, business logic in
  Action classes, authorization in Policies mapped to a real permission
  matrix, no premature abstraction beyond that

## Build order & status

| #   | Module                                                                 | Status                                                   |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Multi-tenancy foundation (`BelongsToCompany`, `CompanyScope`)          | ✅ Done                                                  |
| 2   | Business role/permission system (`BusinessRole`, `BusinessPermission`) | ✅ Done                                                  |
| 3   | Destinations                                                           | ✅ Done                                                  |
| 4   | Customers                                                              | ✅ Done                                                  |
| 5   | Trucks                                                                 | ✅ Done                                                  |
| 6   | Drivers                                                                | ✅ Done                                                  |
| 7   | Contracts (+ routes, lifecycle)                                        | ✅ Done                                                  |
| 8   | Transport Orders (+ trips, lifecycle, snapshots)                       | ✅ Done                                                  |
| 9   | Pricing                                                                | ✅ Done (placeholder, matches original scope)            |
| 10  | Reports (4 tabs + CSV export)                                          | ✅ Done                                                  |
| 11  | Dashboard (real metrics)                                               | ✅ Done                                                  |
| 12  | Settings — business role assignment UI                                 | ✅ Done (new; closed a gap the original role system had) |

Every module above: automated feature tests written and passing, PHPStan
clean, Pint/ESLint/Prettier/tsc clean, and manually clicked through in a real
browser before being marked done.

## Current state (as of this writing)

- 230 automated backend tests passing
- 0 PHPStan errors
- Frontend lint/format/type-check clean
- All modules from the original demo are feature-complete except Pricing,
  which is intentionally still a placeholder (it was one in the original too)

## Known gaps / deliberately deferred

- **Pricing module** beyond the placeholder — not in the original demo's
  scope either; a real "inter-city route price matrix" feature would need its
  own requirements discussion before building.
- **Production deployment** (hosting, environment hardening, backups) — not
  started; current setup is local-dev only (XAMPP MySQL + `composer run dev`).
- **Documentation files** (this `docs/` folder) — written retroactively after
  the module build-out, so that project knowledge doesn't live only in chat
  history.

## Suggested next steps (not yet started)

1. Decide on a production hosting target (VPS, Forge, etc.) and go through a
   deployment checklist.
2. Revisit the Pricing module requirements with the boss if/when it's needed.
3. Consider adding company-level branding/settings if multi-tenant onboarding
   of outside companies becomes a near-term goal rather than a future one.
