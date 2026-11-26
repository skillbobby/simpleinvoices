# Simple Invoices — Laravel multi-tenant rewrite

A modern, multi-company invoicing application built with **Laravel 12**, **Inertia 2** and
**React 19**, styled with the Intercom editorial design system in [`DESIGN-intercom.md`](DESIGN-intercom.md).

Any number of companies can use one installation: each registration creates an isolated tenant with its
own customers, products, invoice numbering, payments and reports. The legacy Zend Framework application
is preserved read-only in [`legacy/`](legacy) for reference.

## Highlights

- **Multi-tenant by construction** — every business table carries `tenant_id`, enforced by a global
  scope (`App\Models\Concerns\BelongsToTenant`) that also runs before route model binding. Cross-tenant
  ids return 404, never another company's data.
- **Invoices that add up** — line items, per-line tax rates, percentage/fixed discounts, proportional tax
  on discounted value, per-tenant sequential numbering (`ACM-0001`), drafts, sent, partial, paid, overdue
  and void states, duplication and CSV report export.
- **Payments ledger** — record payments against an invoice; status, paid total and balance are always
  recomputed from the ledger, and overpayments/void invoices are rejected.
- **Public invoice links** — unguessable tokens, print-friendly page and PDF download for clients
  without an account.
- **Roles** — owner, admin and staff. Settings and team management are admin-only; destructive invoice
  actions require an admin.
- **Reports** — billed vs collected by month, ageing buckets, top customers, tax summary and CSV export.
- **Design system** — cream `#f5f1ec` canvas, white floating cards, hairline borders, charcoal ink and a
  single Fin Orange accent. Tokens live in `resources/css/app.css` and mirror `DESIGN-intercom.md`.

## Getting started

Requirements: PHP 8.2+ with the usual Laravel extensions, Composer, Node 20+.

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run build      # or: npm run dev
php artisan serve
```

SQLite is used by default (`database/database.sqlite`). Point `DB_CONNECTION` at MySQL or PostgreSQL for
production; all migrations are portable.

### Demo data

`php artisan migrate:fresh --seed` creates two companies to demonstrate tenant isolation:

| Company | Login | Password |
|---|---|---|
| Acme Studio (USD, `ACM-` invoices) | `demo@simpleinvoices.test` | `password` |
| Northwind Labs (GBP, `NW-` invoices) | `northwind@simpleinvoices.test` | `password` |

Each tenant has its own customers, catalogue, invoices in different states and payments. Invoice numbers
restart at `0001` for each company.

## Testing & quality

```bash
php artisan test        # feature + unit suites
npm run lint            # eslint
npm run format:check    # prettier
npm run build           # vite production build
```

The suite covers tenant isolation (list, show, update, delete, PDF, public tokens), invoice maths and
lifecycle, payment allocation, roles, registration/tenant provisioning, reports and CSV export.

## Project layout

```
app/Http/Controllers       Dashboard, customers, products, invoices, payments, reports, settings
app/Models                 Tenant, Customer, Product, Invoice, InvoiceItem, Payment, TaxRate...
app/Services               InvoiceService, InvoiceCalculator, InvoiceNumberService, PaymentService
app/Support/TenantContext  Request-scoped active tenant
resources/js/pages         Inertia React pages (dashboard, invoices, customers, ...)
resources/css/app.css      Design tokens from DESIGN-intercom.md
resources/views/pdf        Dompdf invoice template
legacy/                    Original Zend Framework application (reference only)
docs/PLAN-laravel-rewrite.md  Architecture, parity matrix and delivery plan
```

## Notes on scope

Payment-gateway checkout modules from the legacy app (Stripe/PayPal webhooks, recurring cron jobs,
extensions marketplace) are intentionally out of scope for this first pass; the public tokenised invoice
page is the extension point for adding them. See `docs/PLAN-laravel-rewrite.md` for the full parity
matrix and follow-ups.
