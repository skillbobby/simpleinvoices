import { expect, test } from '@playwright/test';
import { login, uniqueSuffix } from './helpers';

test.describe('reports and settings', () => {
    test('reports show seeded activity and export a CSV', async ({ page }) => {
        await login(page);

        await page.goto('/reports');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Reports');
        await expect(page.getByText('Billed').first()).toBeVisible();
        await expect(page.getByText('Collected').first()).toBeVisible();
        await expect(page.getByText('Aging').first()).toBeVisible();

        const from = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
        const to = new Date().toISOString().slice(0, 10);
        const response = await page.request.get(`/reports/export?from=${from}&to=${to}`);

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('text/csv');
        const csv = await response.text();
        expect(csv).toContain('Number,Customer,Status');
        expect(csv).toMatch(/ACM-\d{4}/);
    });

    test('company settings persist and tax rates can be added', async ({ page }) => {
        const suffix = uniqueSuffix();
        const footer = `E2E footer ${suffix}`;
        const taxName = `E2E VAT ${suffix}`;

        await login(page);

        await page.goto('/settings/company');
        await page.getByLabel('Company name').fill('Acme Studio');
        await page.getByLabel('Invoice footer').fill(footer);
        await page.getByRole('button', { name: 'Save changes' }).click();
        await expect(page.getByText('Company settings saved.')).toBeVisible();

        await page.reload();
        await expect(page.getByLabel('Invoice footer')).toHaveValue(footer);

        await page.goto('/settings/tax-rates');
        await page.getByLabel('Name', { exact: true }).fill(taxName);
        await page.locator('#rate').fill('7.5');
        await page.getByRole('button', { name: 'Add tax rate' }).click();

        await expect(page.getByText('Tax rate created.')).toBeVisible();
        await expect(page.getByText(taxName).first()).toBeVisible();
    });

    test('team management adds a staff member who cannot open company settings', async ({ page, browser }) => {
        const suffix = uniqueSuffix();
        const email = `staff.${suffix}@e2e.test`;

        await login(page);
        await page.goto('/settings/team');
        await page.getByLabel('Name', { exact: true }).fill('E2E Staff');
        await page.getByLabel('Email address').fill(email);
        await page.getByLabel('Job title').fill('Billing assistant');
        await page.getByLabel('Password', { exact: true }).fill('password123');
        await page.getByLabel('Confirm password').fill('password123');
        await page.getByRole('button', { name: 'Add team member' }).click();

        await expect(page.getByText('Team member added.')).toBeVisible();
        await expect(page.getByText(email)).toBeVisible();

        const staffContext = await browser.newContext();
        const staffPage = await staffContext.newPage();
        await login(staffPage, email, 'password123');
        await expect(staffPage.getByText('Acme Studio').first()).toBeVisible();

        const response = await staffPage.goto('/settings/company');
        expect(response?.status()).toBe(403);

        await staffContext.close();
    });
});
