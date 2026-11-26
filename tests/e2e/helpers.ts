import { expect, type Page } from '@playwright/test';

export async function login(page: Page, email = 'demo@simpleinvoices.test', password = 'password') {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

export function uniqueSuffix(): string {
    return `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}
