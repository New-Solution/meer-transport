# MeerTransport — UI Specification

## Design system

- **Component library**: shadcn/ui (Radix primitives + Tailwind), the same
  one already used by the Laravel React starter kit — not introduced by this
  project.
- **Styling**: Tailwind CSS utility classes, light/dark mode supported via the
  existing Appearance setting.
- **Layout shell**: sidebar (`app-sidebar.tsx`) + breadcrumb header, unchanged
  from the starter kit's base layout; every page sets its own `breadcrumbs`
  via a static `.layout` function.
- **Status badges**: a small `Record<status, variant>` map per page drives a
  shadcn `<Badge>` color — e.g. Contract/Order status: ACTIVE/CONFIRMED =
  default (solid), DRAFT = secondary (grey), EXPIRED = outline, CANCELLED =
  destructive (red).
- **Data tables**: plain HTML `<table>` styled with Tailwind (no external
  table library), consistent across Contracts, Transport Orders, Reports.
- **Forms**: Inertia's `<Form>` component (or `useForm`) bound directly to
  Laravel Form Request validation; field errors render inline via
  `<InputError>`.

## Page-by-page map

| Page                                   | Route                                             | File                               | Notes                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                              | `/{company}/dashboard`                            | `pages/dashboard.tsx`              | Stat cards, status bar, upcoming expirations table, recent contracts table                                                                                  |
| Customers — list                       | `/{company}/customers`                            | `pages/customers/index.tsx`        | Inline create/edit via modal, archive/restore                                                                                                               |
| Contracts — list                       | `/{company}/contracts`                            | `pages/contracts/index.tsx`        | Search + status filter                                                                                                                                      |
| Contracts — create/edit                | `/{company}/contracts/create`, `/{contract}/edit` | `pages/contracts/form.tsx`         | Dynamic route rows (add/remove)                                                                                                                             |
| Contracts — detail                     | `/{company}/contracts/{contract}`                 | `pages/contracts/show.tsx`         | Activate/Cancel/Archive/Delete actions, routes table                                                                                                        |
| Transport Orders — list                | `/{company}/transport-orders`                     | `pages/transport-orders/index.tsx` | Search + status filter                                                                                                                                      |
| Transport Orders — create/edit         | `.../create`, `.../{id}/edit`                     | `pages/transport-orders/form.tsx`  | Cascading Customer→Contract→Route selects, dynamic trips, add-on charge toggles                                                                             |
| Transport Orders — detail              | `.../{id}`                                        | `pages/transport-orders/show.tsx`  | Confirm/Cancel/Edit/Delete, price-override banner, cancellation banner, trips list                                                                          |
| Destinations                           | `/{company}/destinations`                         | `pages/destinations/index.tsx`     | Modal create/edit/delete                                                                                                                                    |
| Trucks                                 | `/{company}/trucks`                               | `pages/trucks/index.tsx`           | Modal create/edit                                                                                                                                           |
| Drivers                                | `/{company}/drivers`                              | `pages/drivers/index.tsx`          | Modal create/edit                                                                                                                                           |
| Pricing                                | `/{company}/pricing`                              | `pages/pricing/index.tsx`          | Static placeholder card (matches original demo)                                                                                                             |
| Reports                                | `/{company}/reports`                              | `pages/reports/index.tsx`          | 4-tab layout, filter bar per tab, CSV export button                                                                                                         |
| Settings → Profile/Security/Appearance | `/settings/...`                                   | `pages/settings/*.tsx`             | From the starter kit, unmodified                                                                                                                            |
| Settings → Companies                   | `/settings/companies/{company}`                   | `pages/companies/edit.tsx`         | Company rename, member list with **account role** + **business role** dropdowns (business role dropdown added by this project), invitations, delete company |

## Key interaction patterns

- **List filtering** (Contracts, Transport Orders, Reports): typing into a
  search box or changing a Select calls `router.get(url, params, {
  preserveState: true, replace: true })` — a real server round-trip, but
  without a full page flash, and without adding new browser history entries.
- **Destructive actions** (cancel order/contract, remove member) always go
  through a confirmation `<Dialog>` that requires a reason where the backend
  requires one (order/contract cancellation).
- **Toasts**: every create/update/delete/confirm/cancel action flashes a
  success or error toast from the backend (`Inertia::flash('toast', ...)`),
  not a client-only notification — so the message reflects what the server
  actually did.
- **Permission-driven UI**: buttons for actions a user's business role
  doesn't allow (e.g. "Override price", delete) are simply not rendered —
  the backing Policy is still the real enforcement point, the frontend flag
  (e.g. `canOverridePrice`) only avoids showing a control that would fail
  anyway.

## Forms — field-level conventions

- Money fields are entered/displayed as plain decimal SAR (e.g. `3500.00`)
  and converted to/from integer halalas only at the Laravel boundary — the
  user never sees or enters halalas.
- Checkboxes (e.g. truck `is_external`/`is_internal`) are explicitly
  normalized server-side (`prepareForValidation`) because unchecked HTML
  checkboxes don't submit at all — a subtle but important correctness detail
  for "clear this flag" to actually work.
- Dates use native `<input type="date">` fields, submitted as `Y-m-d`
  strings.
