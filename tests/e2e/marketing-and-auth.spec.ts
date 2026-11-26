import { expect, test } from '@playwright/test';
import { uniqueSuffix } from './helpers';

test.describe('marketing site and onboarding', () => {
    test('landing page presents the product and adapts to mobile', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByRole('heading', { level: 1 })).toContainText('Send invoices that feel as considered as your work.');
        await expect(page.getByRole('link', { name: 'Start free' }).first()).toBeVisible();
        await expect(page.getByText('Multi-tenant by design')).toBeVisible();

        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Start free' }).first()).toBeVisible();
    });

    test('a visitor can register a company and gets an isolated dashboard', async ({ page }) => {
        const suffix = uniqueSuffix();
        const company = `E2E Atelier ${suffix}`;

        await page.goto('/');
        await page.getByRole('link', { name: 'Start free' }).first().click();
        await expect(page).toHaveURL(/\/register$/);

        await page.getByLabel('Company name').fill(company);
        await page.getByLabel('Your name').fill('Ada Lovelace');
        await page.getByLabel('Work email').fill(`ada.${suffix}@e2e.test`);
        await page.getByLabel('Password', { exact: true }).fill('password123');
        await page.getByLabel('Confirm').fill('password123');
        await page.getByRole('button', { name: 'Create workspace' }).click();

        await expect(page).toHaveURL(/\/dashboard$/);
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back, Ada');
        await expect(page.getByText(company).first()).toBeVisible();
        await expect(page.getByText('No invoices yet')).toBeVisible();
    });

    test('invalid login shows a validation error', async ({ page }) => {
        await page.goto('/login');
        await page.getByLabel('Email address').fill('demo@simpleinvoices.test');
        await page.getByLabel('Password', { exact: true }).fill('wrong-password');
        await page.getByRole('button', { name: 'Log in' }).click();

        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByText('These credentials do not match our records.')).toBeVisible();
    });
});
