import { test, expect } from '@playwright/test';
import { mockDashboardApi, mockStocksApi, setAuthState, MOCK_USER } from './helpers';

// ── Unauthenticated ───────────────────────────────────────────────────────────

test.describe('Dashboard Layout - unauthenticated', () => {
  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

// ── Authenticated ─────────────────────────────────────────────────────────────

test.describe('Dashboard Layout - authenticated', () => {

  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await mockDashboardApi(page);
    await mockStocksApi(page);
    await page.goto('/dashboard/home');
  });

  test('should render the sidebar with app name and navigation links', async ({ page }) => {
    await expect(page.getByText('MyApp')).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });

  test('should display the top navbar with Dashboard title and username', async ({ page }) => {
    await expect(page.locator('header').getByText('Dashboard')).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(MOCK_USER, 'i') })).toBeVisible();
  });

  test('should show the language selector in the toolbar', async ({ page }) => {
    const langSelect = page.locator('header select');
    await expect(langSelect).toBeVisible();
    await expect(langSelect.locator('option')).toHaveCount(4);
  });

  test('should collapse sidebar when hamburger is clicked', async ({ page }) => {
    const sidebar   = page.locator('aside');
    const toggleBtn = page.locator('header button').first();

    await expect(sidebar).toHaveClass(/w-64/);
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/w-0/);
  });

  test('should expand sidebar after collapsing it', async ({ page }) => {
    const sidebar   = page.locator('aside');
    const toggleBtn = page.locator('header button').first();

    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/w-0/);
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/w-64/);
  });

  test('should highlight the active nav link', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toHaveClass(/bg-indigo-600/);
  });

  test('should open user menu and show Logout option', async ({ page }) => {
    // user menu is the last button in the header (language select is a <select>, not a button)
    await page.locator('header button').last().click();
    await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible();
  });

  test('should log out via sidebar logout button and clear token', async ({ page }) => {
    await page.locator('aside').getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('should log out via user menu', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('menuitem', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to /login when accessing /dashboard without a token after logout', async ({ page }) => {
    await page.locator('aside').getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL('/login');

    await page.goto('/dashboard/home');
    await expect(page).toHaveURL('/login');
  });
});
