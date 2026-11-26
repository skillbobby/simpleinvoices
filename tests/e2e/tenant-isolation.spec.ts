import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('tenant isolation', () => {
    test('a company only sees its own invoices and cannot open another company record by id', async ({ page }) => {
        await login(page, 'northwind@simpleinvoices.test');

        await expect(page.getByText('Northwind Labs').first()).toBeVisible();

        await page.goto('/invoices');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Invoices');
        await expect(page.getByText(/NW-\d{4}/).first()).toBeVisible();
        await expect(page.getByText(/ACM-\d{4}/)).toHaveCount(0);

        // Invoice id 1 belongs to the Acme Studio tenant.
        const response = await page.goto('/invoices/1');
        expect(response?.status()).toBe(404);

        const pdf = await page.request.get('/invoices/1/pdf');
        expect(pdf.status()).toBe(404);
    });

    test('customer and product lists stay inside the signed-in company', async ({ page }) => {
        await login(page, 'northwind@simpleinvoices.test');

        await page.goto('/customers');
        await expect(page.getByText('Kite Robotics').first()).toBeVisible();

        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByText('Northwind Labs').first()).toBeVisible();

        await page.goto('/reports');
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Reports');
    });
});
