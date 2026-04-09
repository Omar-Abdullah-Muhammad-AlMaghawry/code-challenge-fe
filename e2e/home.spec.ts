import { test, expect } from '@playwright/test';
import {
  mockDashboardApi, mockStocksApi, mockStocksError,
  setAuthState, STATS_MOCK, ACTIVITY_MOCK, STOCKS_MOCK, MOCK_USER,
} from './helpers';

test.describe('Home Page', () => {

  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await mockDashboardApi(page);
    await mockStocksApi(page);
    await page.goto('/dashboard/home');
  });

  // ── Welcome Banner ────────────────────────────────────────────────────────────

  test('should display welcome banner with the logged-in username', async ({ page }) => {
    await expect(page.getByText(`Good day, ${MOCK_USER}!`)).toBeVisible();
    await expect(page.getByText("Here's what's happening today.")).toBeVisible();
  });

  // ── Stats Cards ───────────────────────────────────────────────────────────────

  test('should render all stats cards from the API', async ({ page }) => {
    for (const stat of STATS_MOCK) {
      await expect(page.getByText(stat.label)).toBeVisible();
      await expect(page.getByText(stat.value)).toBeVisible();
    }
  });

  test('should render 4 stats cards', async ({ page }) => {
    // The stats grid is a direct child of .space-y-6; stock cards are nested deeper
    const statsCards = page.locator('.space-y-6 > .grid > div');
    await expect(statsCards).toHaveCount(4);
  });

  // ── Recent Activity ───────────────────────────────────────────────────────────

  test('should display the Recent Activity section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /recent activity/i })).toBeVisible();
  });

  test('should render all activity items from the API', async ({ page }) => {
    for (const item of ACTIVITY_MOCK) {
      await expect(page.getByText(item.text)).toBeVisible();
      await expect(page.getByText(item.time)).toBeVisible();
    }
  });

  test('should render 4 activity items', async ({ page }) => {
    const activitySection = page.locator('.bg-white').filter({
      has: page.getByRole('heading', { name: /recent activity/i }),
    });
    await expect(activitySection.locator('.space-y-4 > div')).toHaveCount(4);
  });

  test('should still show activity when stats API fails', async ({ page }) => {
    await page.route('**/api/dashboard/stats', route => route.fulfill({ status: 500, body: 'error' }));
    await page.goto('/dashboard/home');
    await expect(page.getByText(ACTIVITY_MOCK[0].text)).toBeVisible();
    await expect(page.getByText(`Good day, ${MOCK_USER}!`)).toBeVisible();
  });

  // ── Stock Market Section ──────────────────────────────────────────────────────

  test('should display the Stock Market section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /stock market/i })).toBeVisible();
    await expect(page.getByText('Sorted by 24h change')).toBeVisible();
  });

  test('should render a card for each mocked stock', async ({ page }) => {
    for (const stock of STOCKS_MOCK) {
      await expect(page.getByText(stock.symbol)).toBeVisible();
      await expect(page.getByText(stock.name)).toBeVisible();
    }
  });

  test('should show the market badge on each stock card', async ({ page }) => {
    const usaBadges = page.locator('text=USA');
    const egxBadges = page.locator('text=EGX');
    // 3 USA + 2 EGX from mock
    await expect(usaBadges).toHaveCount(4); // 3 cards + 1 filter button
    await expect(egxBadges).toHaveCount(3); // 2 cards + 1 filter button
  });

  test('should show price and change for each stock', async ({ page }) => {
    // AAPL card
    await expect(page.getByText('$170.50')).toBeVisible();
    await expect(page.getByText(/\+2\.30/)).toBeVisible();
  });

  test('should filter stocks by symbol when searching', async ({ page }) => {
    await page.locator('input[placeholder]').fill('AAPL');
    await expect(page.getByText('AAPL')).toBeVisible();
    await expect(page.getByText('GOOGL')).not.toBeVisible();
    await expect(page.getByText('COMI')).not.toBeVisible();
  });

  test('should filter stocks by name when searching', async ({ page }) => {
    await page.locator('input[placeholder]').fill('Apple');
    await expect(page.getByText('Apple Inc.')).toBeVisible();
    await expect(page.getByText('Alphabet Inc.')).not.toBeVisible();
  });

  test('should show empty state when search has no matches', async ({ page }) => {
    await page.locator('input[placeholder]').fill('XYZXYZXYZ');
    await expect(page.getByText('No stocks match your search')).toBeVisible();
  });

  test('should filter to EGX stocks only when EGX tab is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'EGX' }).click();
    await expect(page.getByText('COMI')).toBeVisible();
    await expect(page.getByText('HRHO')).toBeVisible();
    await expect(page.getByText('AAPL')).not.toBeVisible();
  });

  test('should filter to USA stocks only when USA tab is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'USA' }).click();
    await expect(page.getByText('AAPL')).toBeVisible();
    await expect(page.getByText('GOOGL')).toBeVisible();
    await expect(page.getByText('COMI')).not.toBeVisible();
  });

  test('should restore all stocks when ALL tab is clicked after filtering', async ({ page }) => {
    await page.getByRole('button', { name: 'EGX' }).click();
    await expect(page.getByText('AAPL')).not.toBeVisible();

    await page.getByRole('button', { name: 'ALL' }).click();
    await expect(page.getByText('AAPL')).toBeVisible();
    await expect(page.getByText('COMI')).toBeVisible();
  });

  test('should re-fetch stocks when Refresh is clicked', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/stocks**', route => {
      callCount++;
      route.fulfill({ json: STOCKS_MOCK });
    });
    await page.goto('/dashboard/home');
    await page.getByRole('button', { name: /refresh/i }).click();
    await expect(async () => expect(callCount).toBeGreaterThanOrEqual(2)).toPass({ timeout: 5000 });
  });

  test('should show error state when stocks API fails', async ({ page }) => {
    await mockStocksError(page);
    await page.goto('/dashboard/home');
    await expect(page.getByText('Failed to load stocks.')).toBeVisible({ timeout: 5000 });
  });

  test('should combine search and market filter', async ({ page }) => {
    await page.getByRole('button', { name: 'USA' }).click();
    await page.locator('input[placeholder]').fill('Apple');
    await expect(page.getByText('Apple Inc.')).toBeVisible();
    await expect(page.getByText('Alphabet Inc.')).not.toBeVisible();
    await expect(page.getByText('COMI')).not.toBeVisible();
  });
});
