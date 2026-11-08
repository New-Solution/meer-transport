# MeerTransport — Product Requirements Document (PRD)

## 1. Background

The boss supplied an existing demo application ("MeerTransport") built as a pure
frontend prototype: React + Vite, with all data stored client-side in the
browser via IndexedDB (through a wrapper library called Dexie). There was no
server, no shared database, and no real authentication — every browser had its
own disconnected copy of the data.

The boss's request, verbatim, had three parts:

1. Rebuild this in **Laravel**.
2. Keep the **same frontend** (look, feel, and behavior).
3. Use **MySQL or PostgreSQL** as the database.

## 2. Goal

Turn the demo into a real, production-quality, multi-user web application that
a trucking company could actually run their operations on — without losing any
of the functionality or workflows already designed in the demo.

## 3. Key product decision: multi-tenant SaaS from day one

The original demo had only a loose idea of "companies" with no real data
isolation. We decided to build the real system as a proper **multi-tenant
SaaS**: one single deployment of the app can host many different trucking
companies, each with its own private users, customers, contracts, trucks,
drivers, and orders — similar to how Shopify hosts many independent stores on
one platform.

This was a deliberate investment beyond the literal ask, made explicit and
agreed on before implementation started, because:

- The original demo's data model didn't cleanly separate company data.
- Retrofitting multi-tenancy after the fact (once there's real customer data)
  is expensive and risky.
- Building it in from day one costs little extra now.

See [TRD.md](TRD.md) for how this is enforced technically.

## 4. Users & roles

Every user belongs to one or more companies. Within a company, a user has a
**business role** that controls what they can do operationally:

| Role                   | Can do                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Admin**              | Everything                                                                                                                  |
| **Operations Manager** | Manage contracts, customers, orders, pricing, trucks, drivers, destinations, reports; can cancel orders and override prices |
| **Dispatcher**         | View contracts/customers, create/edit orders, manage trucks/drivers/destinations, view reports                              |
| **Viewer**             | Read-only access to contracts, customers, orders, trucks, drivers, destinations, reports                                    |

This is separate from the **account role** (Owner / Admin / Member), which
controls account-management things like inviting people to the company or
deleting the company itself — not day-to-day trucking operations. See
[TRD.md](TRD.md) for why these are two separate systems.

## 5. Features (modules)

All modules below were present as a concept in the original demo and have now
been rebuilt as real, server-backed, tested features — except Pricing, which
was a placeholder in the original and remains a placeholder here.

| Module           | Status      | Summary                                                                                                                |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| Destinations     | Done        | Reusable delivery drop-off locations                                                                                   |
| Customers        | Done        | Client company records (CR/VAT/unified numbers, address), can be archived                                              |
| Trucks           | Done        | Fleet vehicle records (plate, type, internal/external flag)                                                            |
| Drivers          | Done        | Driver roster (ID/Iqama, license, contact info)                                                                        |
| Contracts        | Done        | Agreements with a customer: multiple priced routes, lifecycle (Draft → Active → Expired/Cancelled)                     |
| Transport Orders | Done        | Shipment jobs against a contract: trips, truck/driver assignment, confirm/cancel workflow, price override              |
| Pricing          | Placeholder | Same "future milestone" placeholder as the original demo                                                               |
| Reports          | Done        | 4 report views (customer contracts, active contracts, expired contracts, route price list) with filters and CSV export |
| Dashboard        | Done        | Live overview: contract counts by status, upcoming expirations, recent contracts                                       |
| Settings         | Done        | Profile, password, appearance, company management, and business-role assignment for teammates                          |

Full user-facing flow for each is described in [AppFlow.md](AppFlow.md).

## 6. Out of scope (for now)

- Pricing module beyond the placeholder (explicitly deferred, matches the
  original demo's own scope)
- Deployment/hosting setup for a live production environment
- Mobile app
- Payments/invoicing

## 7. Success criteria

- Every workflow present in the original demo works the same way for the end
  user, now backed by a real shared database and real logins.
- Data is strictly isolated per company at the database/query level, not just
  hidden in the UI.
- The codebase is automatically tested (230 tests at last count) and passes
  static analysis and linting, so changes can be made safely going forward.
