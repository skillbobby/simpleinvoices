# Simple Invoices → Laravel multi-tenant rewrite

## Goal

Rebuild Simple Invoices as a modern Laravel 12 + Inertia/React application that any number of
companies ("tenants") can use to invoice their own clients, styled with the Intercom design system
in [`DESIGN-intercom.md`](../DESIGN-intercom.md).

The legacy Zend Framework 1 application is preserved untouched in [`legacy/`](../legacy) so feature
behaviour can be compared while the rewrite lands. The Laravel app lives at the repository root.

## Stack

| Concern | Choice |
|---|---|
| Framework | Laravel 12 (PHP 8.2+), SQLite by default, MySQL/PostgreSQL supported |
| UI | Laravel React starter kit (Inertia 2, React 19, TypeScript, Tailwind 4, shadcn/ui) |
| Auth | Starter-kit session auth (login, register, password reset, email verification, 2FA-ready) |
| PDF | `barryvdh/laravel-dompdf` |
| Tests | PHPUnit feature/unit tests (tenant isolation, money maths, lifecycle) |

## Multi-tenancy model

Single database, shared schema, `tenant_id` on every business table.

* `tenants` — one row per company. Holds company profile, branding, invoice numbering counters,
  currency, payment terms defaults, bank details and invoice footer.
* `users.tenant_id` + `users.role` (`owner`, `admin`, `staff`) — a user belongs to exactly one
  company. Registration creates the tenant and the owner in one transaction.
* `App\Support\TenantContext` — request-scoped singleton holding the active tenant.
* `App\Models\Concerns\BelongsToTenant` — global scope that filters every query by
  `tenant_id` and auto-fills it on create. Route-model binding therefore cannot leak another
  tenant's records (404, not 403).
* Public invoice links (`/i/{token}`) explicitly bypass the global scope and are reachable
  without authentication.
* Team management lets owners/admins add staff users to their own tenant only.

## Domain model

```
tenants 1─* users
tenants 1─* customers 1─* invoices 1─* invoice_items
tenants 1─* products        invoices 1─* payments
tenants 1─* tax_rates       invoices *─1 payment_terms
tenants 1─* payment_terms
```

Invoice money is stored in minor-unit-safe `decimal(15,2)` columns: `subtotal`, `discount_amount`,
`tax_total`, `total`, `amount_paid`, `balance`. Line items store quantity, unit price, applied tax
rate and computed line totals. `InvoiceService` owns all money maths and numbering so the same code
path is used by web requests, tests and seeders.

Invoice lifecycle: `draft → sent → partial → paid`, with `void` as a terminal opt-out. `overdue`
is derived (`sent|partial` + past due date + balance > 0) so it can never drift from the data.

## Feature parity matrix

| Legacy module | Laravel implementation |
|---|---|
| `modules/invoices` | `InvoiceController`, invoice builder, public share link, PDF, duplicate/void |
| `modules/customers` | `CustomerController` + customer detail with invoice history |
| `modules/products`, `inventory` | `ProductController` (SKU, price, tax, active flag) |
| `modules/payments`, `payment` | `PaymentController` + per-invoice payment recording, auto status |
| `modules/billers` | Company profile on `tenants` (single biller per company) |
| `modules/tax_rates`, `payment_terms`, `currencies` | Settings screens (tax rates, terms, currency) |
| `modules/reports` | Reports: monthly revenue, aging, top customers, tax summary, CSV export |
| `modules/user`, `auth` | Starter-kit auth + team management with roles |
| `modules/system_defaults` | Tenant settings (numbering, footer, bank details, defaults) |
| `modules/api/*` payment gateways | Out of scope for v1; public tokenised invoice page is the pay hook |
| `modules/cron`, `extensions` | Out of scope for v1 (documented as follow-ups) |

## UI system

Tokens are declared once in `resources/css/app.css` under Tailwind 4 `@theme`:

* `--color-canvas: #f5f1ec` cream app ground, never pure white page backgrounds.
* `--color-surface: #ffffff` cards lifted off the cream, `--color-hairline: #d3cec6` 1px borders.
* `--color-ink: #111111`, `--color-ink-muted: #626260`, `--color-ink-subtle: #7b7b78`.
* `--color-fin: #ff5600` reserved for the single accent CTA/badge, never a page background.
* Radii 8/12/16px (`md`/`lg`/`xl`), no drop shadows on floating cards.
* Type: Inter (open-source Saans substitute) with weight 500 display and 400 body.

## Delivery phases

1. **Foundation** — branch, legacy relocation, plan, tenancy primitives, schema, models, seeders.
2. **Domain services** — invoice numbering/calculator/payment allocation, policies for roles.
3. **HTTP layer** — dashboard, customers, products, invoices, payments, public invoice, PDF.
4. **Settings & reports** — company profile, tax rates, terms, team, reporting + CSV.
5. **Frontend** — Intercom-themed layout, pages, forms and accessible components.
6. **Verification** — PHPUnit suite (tenant isolation, totals, lifecycle, public access, roles),
   `npm run build`, `npm run lint`, `php artisan test`.

## Parallelisation (multi-agent)

Work is split by file ownership so agents never edit the same file:

* Agent A: reports + CSV export (controller, page, tests) after the core schema is in place.
* Agent B: settings pages (company, tax rates, payment terms, team) against fixed routes.
* Agent C: invoice PDF/public invoice template (Blade) + feature tests.
* Core (tenancy, invoices, payments, dashboard, layout) is built centrally because everything
  depends on it. Agents receive the route/contract table from this document before starting.

## Verification checklist

* `php artisan test` green, including two tenants with overlapping IDs.
* `npm run build` produces assets; `npm run lint` clean.
* Seeded demo tenant (`demo@simpleinvoices.test` / `password`) shows invoices, payments, reports.
* Public invoice link renders without auth and cannot be guessed.
* No business query runs without a tenant scope (except explicit public/aggregate cases).

## Implementation status (delivered on `feature/laravel-multitenant`)

| Area | Status | Notes |
|---|---|---|
| Tenancy foundation | ✅ | `tenants`, `TenantContext`, `BelongsToTenant`, tenant-aware route binding, `EnsureTenant` guard |
| Auth & onboarding | ✅ | Registration creates company + owner + default tax rate/payment terms |
| Customers | ✅ | CRUD, search/filter, detail with invoices, payment history and lifetime stats |
| Products & tax | ✅ | Catalogue CRUD, tax rates with single default, units |
| Invoices | ✅ | Builder with line items, per-line tax, %/fixed discounts, per-tenant numbering, draft/sent/partial/paid/void, duplicate, public token, PDF |
| Payments | ✅ | Ledger with overpayment protection, automatic status/balance/paid-at recalculation, admin-only deletion |
| Reports | ✅ | Monthly billed vs collected, ageing buckets, top customers, tax summary, status breakdown, CSV export |
| Settings | ✅ | Company profile/logo, numbering, defaults, invoice content, tax rates, payment terms, team & roles |
| Design system | ✅ | Cream canvas, white cards, hairline borders, charcoal buttons, Fin Orange accents, Inter type scale |
| Tests | ✅ | 65 tests / 500 assertions: isolation, lifecycle, maths, roles, PDF, reports, page smoke test |

### Deviations / intentional simplifications

* One biller per company — the legacy multi-biller table is folded into `tenants`.
* Payment gateway checkout + webhook modules and the cron/recurring engine are out of scope for v1;
  the tokenised public invoice page is the integration point for adding them.
* `overdue` is derived from data (sent/partial, past due date, positive balance) rather than stored, so it
  cannot drift when payments or due dates change.
* Legacy PDF/template plugin hooks are replaced by a single Dompdf Blade template.

### Multi-agent split used

* `customers-ui` — customers index/show/create/edit + shared customer form.
* `catalog-ui` — products pages, payments ledger page, reports dashboard.
* `settings-ui` — settings layout + company/tax rates/payment terms/team pages.
* Core (schema, services, invoice flow, dashboard, public invoice, PDF, tests, design tokens) built centrally.
