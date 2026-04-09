import { test, expect } from '@playwright/test';
import { mockDashboardApi, setAuthState, MOCK_USER } from './helpers';

// Redirect test runs WITHOUT auth state
test.describe('Dashboard Layout - unauthenticated', () => {
  test('should redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

// All other tests run WITH auth state
test.describe('Dashboard Layout - authenticated', () => {

  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await mockDashboardApi(page);
    await page.goto('/dashboard/home');
  });

  test('should render the sidebar with navigation items', async ({ page }) => {
    await expect(page.getByText('MyApp')).toBeVisible();
    await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Analytics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible();
  });

  test('should display the top navbar with title and username', async ({ page }) => {
    await expect(page.getByRole('banner').getByText('Dashboard')).toBeVisible();
    // User menu button contains the username
    await expect(page.getByRole('button', { name: new RegExp(MOCK_USER, 'i') })).toBeVisible();
  });

  test('should toggle sidebar closed when hamburger is clicked', async ({ page }) => {
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveClass(/w-64/);

    // The toggle button is the first button in the header
    await page.locator('header button').first().click();
    await expect(sidebar).toHaveClass(/w-0/);
  });

  test('should toggle sidebar open after closing it', async ({ page }) => {
    const sidebar    = page.locator('aside');
    const toggleBtn  = page.locator('header button').first();

    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/w-0/);

    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/w-64/);
  });

  test('should show active highlight on the current nav link', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /Home/i });
    await expect(homeLink).toHaveClass(/bg-indigo-600/);
  });

  test('should open user menu and show Logout option', async ({ page }) => {
    // The user menu button is the last button in the header
    await page.locator('header button').last().click();
    await expect(page.getByRole('menuitem', { name: /Logout/i })).toBeVisible();
  });

  test('should log out and redirect to /login via sidebar logout button', async ({ page }) => {
    await page.locator('aside').getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL('/login');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('should log out via user menu', async ({ page }) => {
    await page.locator('header button').last().click();
    await page.getByRole('menuitem', { name: /Logout/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
