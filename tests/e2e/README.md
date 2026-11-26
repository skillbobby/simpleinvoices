# Browser end-to-end tests

Playwright drives a real Chromium browser against the application served by `php artisan serve`.

```bash
npx playwright install chromium   # first run only
npm run test:e2e                  # resets + seeds SQLite, then runs every spec
npm run test:e2e:report           # open the last HTML report
```

**`npm run test:e2e` runs `php artisan migrate:fresh --seed`** so it always starts from the two demo
tenants. Never point it at a database you care about; set `E2E_BASE_URL` to run the specs against an
already-running server without Playwright managing the process.

## Coverage

| Spec                           | What it proves                                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marketing-and-auth.spec.ts`   | Landing page renders on desktop and mobile; visitor can register a company; invalid credentials show an error                                                                       |
| `invoice-lifecycle.spec.ts`    | Customer + product creation, invoice builder with percentage discount, per-tenant numbering, totals, send, public link, PDF download, payment collection and status/balance updates |
| `reports-and-settings.spec.ts` | Reports render and export CSV; company settings persist; tax rates can be added; a newly invited staff member is blocked from company settings (403)                                |
| `tenant-isolation.spec.ts`     | A second company only sees its own invoice numbers, and another tenant's invoice id/PDF returns 404                                                                                 |
