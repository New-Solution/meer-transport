# MeerTransport — App Flow

This describes how a user actually moves through the application, screen by
screen, and the lifecycle of the key business objects.

## 1. Sign up / login / company context

1. A new user visits `/register`, creates an account → a **personal company**
   is automatically created for them (`is_personal = true`) and they become
   its Owner/Admin.
2. They can be invited to join other companies (via `company_invitations`);
   accepting an invite adds them as a `company_members` row with whatever
   account role and a default `viewer` business role.
3. Every screen in the app lives under a `/{company-slug}/...` URL. The
   sidebar's **company switcher** changes which company's data the user is
   currently looking at, by changing `current_company_id` on the user and
   redirecting to the equivalent page under the new company's slug.
4. A middleware (`EnsureCompanyMembership`) blocks access to any
   `{company}/...` route the logged-in user doesn't actually belong to.

## 2. Main navigation (sidebar)

Dashboard → Customers → Contracts → Transport Orders → Destinations → Trucks
→ Drivers → Pricing → Reports.

Settings (profile/password/appearance/company management) is reached from the
user menu, not the main sidebar — same as the Laravel starter kit's default
layout.

## 3. Core setup data (prerequisites for everything else)

Before a contract or order can be created, a company typically sets up:

- **Destinations** — simple CRUD, a destination is just a name + Google Maps
  link, used later when defining contract routes.
- **Customers** — simple CRUD (name, CR number, VAT number, unified number,
  address). A customer can be **archived** (soft-disabled, not deleted) once
  it has contracts, so historical contracts still reference it.
- **Trucks** / **Drivers** — simple CRUD, used later when assigning trips.

## 4. Contract lifecycle

```
  create (DRAFT) ──activate──> ACTIVE ──(time passes past expiry_date)──> EXPIRED
       │                          │
       └────────cancel───────────┴──────────cancel──────────> CANCELLED
```

1. **Create** — pick a customer, contract date, expiry date, and one or more
   **routes** (from city → to city, vehicle type, price + optional
   return/stay/stop/additional prices). Starts as DRAFT.
2. **Activate** — moves DRAFT → ACTIVE. Only an ACTIVE contract (within its
   date window) can have transport orders placed against it.
3. **Expire** — not a button. The system automatically treats an ACTIVE
   contract as EXPIRED once today's date passes its `expiry_date` — this is
   computed every time the contract is viewed, not a background job.
4. **Cancel** — available from DRAFT or ACTIVE, requires a reason, is final.
5. **Archive** — hides a contract from the main list without deleting it (used
   once a contract is no longer relevant but shouldn't be destroyed).
6. **Delete** — only allowed while still DRAFT (nothing has happened yet).
   Once ACTIVE/EXPIRED/CANCELLED, a contract is permanent history.

## 5. Transport order lifecycle

```
  create (DRAFT) ──confirm──> CONFIRMED
       │                          │
       └─────────cancel───────────┴──> CANCELLED
       │
     delete (DRAFT only)
```

1. **Create** — the form cascades: pick a Customer → only that customer's
   eligible contracts appear → pick a Contract → only that contract's routes
   appear → pick a Route → price auto-fills from the contract (can be
   overridden by a user with the `transport_order:price_override`
   permission, with a required reason). Add one or more **trips** (each can
   optionally get a truck + driver assigned), and optional add-on charges
   (return/stay/stop/additional — each toggled on/off with its own price).
2. **Confirm** — DRAFT → CONFIRMED, locks in the order and its trips.
3. **Cancel** — requires a reason, available unless already cancelled; shown
   with a visible audit banner (who, when, why) afterward.
4. **Delete** — only allowed while DRAFT.

At creation time, the order **snapshots** the customer's details, the
contract's details, and the route's pricing into JSON columns — so even if
the customer's address or the contract's price changes afterward, this order
still shows exactly what was agreed when it was placed.

## 6. Reports

A single page with 4 tabs (Customer Contracts, Active Contracts, Expired
Contracts, Contract Routes & Prices). Each tab has its own filters (customer,
date range, status, city, contract number) that re-query the server on
change, plus an **Export CSV** button that downloads the currently filtered
rows as a real file.

## 7. Dashboard

The landing page after login: 4 stat cards (customers, total/active/expired
contracts), a visual breakdown bar across all 4 statuses, a table of
contracts expiring within 30 days (soonest first), and a table of the 6 most
recently dated contracts.

## 8. Settings → assigning operational roles

A company Owner/Admin goes to **Settings → Companies → (their company)**,
and for each member can now set:

- their **account role** (owner/admin/member — existing feature), and
- their **business role** (admin/operations_manager/dispatcher/viewer — new
  dropdown we added), which immediately changes what that person can do on
  every operational screen (contracts, orders, trucks, etc.) the next time
  they load a page.
