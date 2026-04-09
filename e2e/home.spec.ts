import { test, expect } from '@playwright/test';
import { mockDashboardApi, setAuthState, STATS_MOCK, ACTIVITY_MOCK, MOCK_USER } from './helpers';

test.describe('Home Page', () => {

  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await mockDashboardApi(page);
    await page.goto('/dashboard/home');
  });

  test('should display welcome banner with the logged-in username', async ({ page }) => {
    await expect(page.getByText(`Good day, ${MOCK_USER}!`)).toBeVisible();
    await expect(page.getByText("Here's what's happening with your app today.")).toBeVisible();
  });

  test('should render all stats cards from the API', async ({ page }) => {
    for (const stat of STATS_MOCK) {
      await expect(page.getByText(stat.label)).toBeVisible();
      await expect(page.getByText(stat.value)).toBeVisible();
    }
  });

  test('should render 4 stats cards', async ({ page }) => {
    const cards = page.locator('.grid > div');
    await expect(cards).toHaveCount(4);
  });

  test('should display the Recent Activity section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
  });

  test('should render all activity items from the API', async ({ page }) => {
    for (const item of ACTIVITY_MOCK) {
      await expect(page.getByText(item.text)).toBeVisible();
      await expect(page.getByText(item.time)).toBeVisible();
    }
  });

  test('should render 4 activity items', async ({ page }) => {
    const items = page.locator('.space-y-4 > div');
    await expect(items).toHaveCount(4);
  });

  test('should still load activity when stats API fails', async ({ page }) => {
    // Override the stats route to return 500 for this test
    await page.route('**/api/dashboard/stats', route => route.fulfill({ status: 500, body: 'error' }));
    await page.goto('/dashboard/home');

    // Activity should still render
    await expect(page.getByText(ACTIVITY_MOCK[0].text)).toBeVisible();
    // Welcome banner should still render
    await expect(page.getByText(`Good day, ${MOCK_USER}!`)).toBeVisible();
  });
});
