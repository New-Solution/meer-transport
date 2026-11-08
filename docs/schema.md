# MeerTransport — Database Schema

All tables use MySQL. Every operational table below belongs to exactly one
`company` via `company_id` (see [TRD.md](TRD.md) §2 for how isolation is
enforced in code). Money columns are integer **halalas** (÷100 for SAR).

## Account & tenancy tables (from the Laravel starter kit)

### `users`

Core login/identity. `id`, `name`, `email` (unique), `email_verified_at`,
`password`, plus two-factor and passkey columns added by later migrations,
and `current_company_id` (which company the user is currently "in").

### `companies`

A tenant. `id`, `name`, `slug` (unique, used in every URL, e.g.
`/tariq-al-mansoors-company/dashboard`), `is_personal` (every user gets one
personal company automatically on signup), soft-deletable.

### `company_members` (pivot: users ↔ companies)

`id`, `company_id`, `user_id`, **`role`** (account role: owner / admin /
member — controls account/billing-style permissions), **`business_role`**
(operational role: admin / operations_manager / dispatcher / viewer —
controls what the user can do with trucking data day-to-day). Unique on
(`company_id`, `user_id`).

### `company_invitations`

Pending invites to join a company: `code` (unique token), `company_id`,
`email`, `role`, `invited_by`, `expires_at`, `accepted_at`.

## Operational tables (built this project)

### `destinations`

Reusable drop-off locations.
`id`, `company_id`, `name`, `google_maps_url`. Unique on (`company_id`, `name`).

### `customers`

Client companies you transport goods for.
`id`, `company_id`, `name`, `cr_number`, `unified_number`, `vat_number`,
`address`, `archived_at` (nullable — soft "inactive" flag, not a delete).

### `trucks`

Fleet vehicles.
`id`, `company_id`, `weight_type`, `vehicle_type`, `license_plate`,
`normalized_license_plate` (Arabic/English-normalized form used for
uniqueness checks), `is_external`, `is_internal`. Unique on (`company_id`,
`normalized_license_plate`).

### `drivers`

`id`, `company_id`, `first_name`, `last_name`, `nationality`, `license_no`,
`license_expiry`, `saudi_id_iqama_no`, `id_iqama_expiry`, `mobile_phone_1`,
`mobile_phone_2`, `home_city`. Unique on (`company_id`, `saudi_id_iqama_no`).

### `contracts`

An agreement with a customer.
`id`, `company_id`, `contract_number` (unique per company), `customer_id`
(FK, restrict on delete — can't delete a customer with contracts),
`customer_snapshot` (JSON — customer details frozen at contract time),
`contract_date`, `expiry_date`, `status` (DRAFT / ACTIVE / CANCELLED —
EXPIRED is _computed_, never stored — see [TRD.md](TRD.md) §6),
`cancelled_at`, `cancelled_by`, `cancellation_reason`, `archived_at`.

### `contract_routes`

Priced lanes belonging to a contract (a contract can have many routes).
`id`, `company_id`, `contract_id` (FK, cascade delete with the contract),
`from_city`, `to_city`, `destination_id` (optional FK to `destinations`),
`vehicle_type`, `price_halalas`, `sort_order`, plus optional add-on prices:
`return_price_halalas`, `stay_price_halalas`, `stop_price_halalas`,
`additional_price_halalas`.

### `transport_orders`

An actual shipment job placed against a contract route.
`id`, `company_id`, `order_number` (unique per company, auto-generated e.g.
`TO-2026-0001`), `order_date`, `required_delivery_date`, `customer_id` (FK,
restrict), `customer_snapshot` (JSON), `contract_id` (FK, restrict),
`contract_snapshot` (JSON), `contract_route_id` (FK, restrict),
`route_snapshot` (JSON), `customer_po_number`, `applied_price_halalas`,
`price_overridden`, `override_reason`, `override_authorized_by`,
`override_authorized_at`, `trip_count`, `total_amount_halalas`,
`additional_charges` (JSON array of enabled add-ons and their prices),
`currency` (default `SAR`), `status` (DRAFT / CONFIRMED / CANCELLED),
`cargo_details` (JSON), `loading_instructions`, `delivery_instructions`,
`internal_remarks`, `confirmed_at`, `confirmed_by`, `cancelled_at`,
`cancelled_by`, `cancellation_reason`.

Why three snapshot columns? If the customer's address or the contract's
pricing changes _after_ an order was placed, the order still shows exactly
what was true at the time it was created — needed for historical accuracy
and audits.

### `transport_trips`

One or more physical truck trips that fulfill a transport order.
`id`, `company_id`, `order_id` (FK, cascade delete with the order),
`trip_number`, `sequence_number`, `status`, `from_city`, `to_city`,
`vehicle_type`, `applied_price_halalas`, `planned_pickup_date`,
`planned_delivery_date`, `cargo_details` (JSON), `special_notes`, `truck_id`
(optional FK, restrict on delete), `driver_id` (optional FK, restrict on
delete), `truck_amount_halalas`.

## Entity relationship summary

```
Company ──< CompanyMember >── User
Company ──< CompanyInvitation
Company ──< Destination
Company ──< Customer ──< Contract ──< ContractRoute
Company ──< Truck
Company ──< Driver
Company ──< TransportOrder >── Customer
                 │  └──< Contract
                 │  └──< ContractRoute
                 └──< TransportTrip >── Truck
                                     >── Driver
```

(`──<` reads as "has many"; `>──` reads as "belongs to".)
