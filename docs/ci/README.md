# CI workflows

These are the Laravel starter-kit GitHub Actions workflows. They are kept here (rather than in
`.github/workflows/`) because the automation token used for the initial push is not allowed to create
workflow files. Copy them into `.github/workflows/` to enable CI:

```bash
mkdir -p .github/workflows
cp docs/ci/lint.yml docs/ci/tests.yml .github/workflows/
```

- `tests.yml` runs `php artisan test` on PHP 8.4 with SQLite.
- `lint.yml` runs Pint, Prettier and ESLint.
