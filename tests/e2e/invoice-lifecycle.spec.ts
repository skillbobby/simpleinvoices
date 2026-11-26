import { expect, test } from '@playwright/test';
import { login, uniqueSuffix } from './helpers';

test.describe('invoice lifecycle', () => {
    test('create a customer, product, invoice, share it, and collect payment', async ({ page }) => {
        const suffix = uniqueSuffix();
        const customerName = `E2E Client ${suffix}`;
        const customerCompany = `E2E Holdings ${suffix}`;
        const productName = `E2E Retainer ${suffix}`;

        await login(page);
        await expect(page.getByText('Acme Studio').first()).toBeVisible();

        // 1. Customer
        await page.goto('/customers/create');
        await page.getByLabel('Name', { exact: true }).fill(customerName);
        await page.getByLabel('Company').fill(customerCompany);
        await page.getByLabel('Email').fill(`billing.${suffix}@e2e.test`);
        await page.getByLabel('City').fill('San Francisco');
        await page.getByRole('button', { name: 'Create customer' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toContainText(customerName);
        await expect(page.getByText(customerCompany).first()).toBeVisible();

        // 2. Product
        await page.goto('/products/create');
        await page.getByLabel('Name', { exact: true }).fill(productName);
        await page.getByLabel('SKU').fill(`E2E-${suffix}`);
        await page.getByLabel('Unit', { exact: true }).fill('month');
        await page.getByLabel('Unit price').fill('1200');
        await page.getByRole('button', { name: 'Create product' }).click();

        await expect(page).toHaveURL(/\/products$/);
        await expect(page.getByText(productName).first()).toBeVisible();

        // 3. Invoice
        await page.goto('/invoices/create');
        await page.getByLabel('Customer').selectOption({ label: `${customerCompany} — ${customerName}` });
        await page.getByPlaceholder('Description').fill(productName);
        await page.getByLabel('Quantity').fill('2');
        await page.getByLabel('Unit price').fill('600');
        await page.locator('select:has(option[value="percent"])').selectOption('percent');
        await page.locator('aside input[type="number"]').fill('10');

        await expect(page.getByText('$1,080.00').first()).toBeVisible();

        await page.getByRole('button', { name: 'Create invoice' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toContainText(/ACM-\d{4,}/);
        const invoiceNumber = (await page.getByRole('heading', { level: 1 }).innerText()).trim();
        await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('$1,080.00').first()).toBeVisible();

        // 4. Send + public link
        await page.getByRole('button', { name: 'Mark as sent' }).click();
        await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible();

        const publicHref = await page.getByRole('link', { name: 'View public page' }).getAttribute('href');
        expect(publicHref).toBeTruthy();
        const publicUrl = new URL(publicHref!, 'http://127.0.0.1:8111').toString();

        const publicPage = await page.context().newPage();
        await publicPage.goto(publicUrl);
        await expect(publicPage.getByText(invoiceNumber).first()).toBeVisible();
        await expect(publicPage.getByText('Acme Studio').first()).toBeVisible();
        await expect(publicPage.getByText(customerCompany).first()).toBeVisible();
        await expect(publicPage.getByText('$1,080.00').first()).toBeVisible();
        await publicPage.close();

        const pdf = await page.request.get(publicUrl + '/pdf');
        expect(pdf.status()).toBe(200);
        expect(pdf.headers()['content-type']).toContain('application/pdf');
        const pdfBytes = await pdf.body();
        expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF');

        // 5. Collect payment
        await page.getByRole('button', { name: 'Record payment' }).click();
        await expect(page.getByText('This invoice is settled.')).toBeVisible();

        await page.goto('/invoices');
        await expect(page.getByText(invoiceNumber).first()).toBeVisible();
        const row = page.locator('tr', { hasText: invoiceNumber });
        await expect(row.getByText('Paid', { exact: true })).toBeVisible();
        await expect(row.getByText('$0.00')).toBeVisible();
    });

    test('invoice totals recalculate when the draft is edited', async ({ page }) => {
        const suffix = uniqueSuffix();
        const customerName = `Draft Client ${suffix}`;

        await login(page);

        await page.goto('/customers/create');
        await page.getByLabel('Name', { exact: true }).fill(customerName);
        await page.getByRole('button', { name: 'Create customer' }).click();
        await expect(page.getByRole('heading', { level: 1 })).toContainText(customerName);

        await page.goto('/invoices/create');
        await page.getByLabel('Customer').selectOption({ label: customerName });
        await page.getByPlaceholder('Description').fill('Exploration');
        await page.getByLabel('Quantity').fill('1');
        await page.getByLabel('Unit price').fill('500');
        await page.getByRole('button', { name: 'Create invoice' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toContainText(/ACM-\d{4,}/);

        await page.getByRole('link', { name: 'Edit' }).click();
        await page.getByLabel('Unit price').fill('750');
        await page.getByRole('button', { name: 'Save invoice' }).click();

        await expect(page.getByRole('heading', { level: 1 })).toContainText(/ACM-\d{4,}/);
        await expect(page.getByText('$750.00').first()).toBeVisible();
        await expect(page.getByText('Balance due').first()).toBeVisible();
    });
});
