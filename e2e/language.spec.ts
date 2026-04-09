import { test, expect } from '@playwright/test';
import { clearAuthState, setAuthState, mockDashboardApi, mockStocksApi } from './helpers';

// ── Login / Register pages ────────────────────────────────────────────────────

test.describe('Language switching - auth pages', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/login');
  });

  test('should default to English', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.locator('select')).toHaveValue('en');
  });

  test('should switch UI to German', async ({ page }) => {
    await page.selectOption('select', 'de');
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Welcome Back')).not.toBeVisible();
  });

  test('should switch UI to Spanish', async ({ page }) => {
    await page.selectOption('select', 'es');
    await expect(page.getByText('Bienvenido de nuevo')).toBeVisible({ timeout: 5000 });
  });

  test('should switch UI to Arabic and set RTL direction', async ({ page }) => {
    await page.selectOption('select', 'ar');
    await expect(page.getByText('مرحباً بعودتك')).toBeVisible({ timeout: 5000 });
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('should restore LTR direction when switching back from Arabic', async ({ page }) => {
    await page.selectOption('select', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    await page.selectOption('select', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('should translate the register page', async ({ page }) => {
    await page.goto('/register');
    await page.selectOption('select', 'de');
    await expect(page.getByText('Konto erstellen')).toBeVisible({ timeout: 5000 });
  });

  test('should persist language across navigation', async ({ page }) => {
    await page.selectOption('select', 'es');
    await expect(page.getByText('Bienvenido de nuevo')).toBeVisible({ timeout: 5000 });

    // Navigate to register — language should still be Spanish
    await page.goto('/register');
    await expect(page.getByText('Registrarse para comenzar').or(page.getByText('Regístrate para comenzar'))).toBeVisible({ timeout: 5000 });
  });

  test('should save language choice to localStorage', async ({ page }) => {
    await page.selectOption('select', 'de');
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 5000 });

    const saved = await page.evaluate(() => localStorage.getItem('lang'));
    expect(saved).toBe('de');
  });

  test('should restore saved language on page reload', async ({ page }) => {
    await page.selectOption('select', 'de');
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 5000 });
  });
});

// ── Dashboard ─────────────────────────────────────────────────────────────────

test.describe('Language switching - dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await setAuthState(page);
    await mockDashboardApi(page);
    await mockStocksApi(page);
    await page.goto('/dashboard/home');
  });

  test('should show language selector in the toolbar', async ({ page }) => {
    const langSelect = page.locator('header select');
    await expect(langSelect).toBeVisible();
    await expect(langSelect.locator('option')).toHaveCount(4);
  });

  test('should translate the dashboard header to German', async ({ page }) => {
    await page.locator('header select').selectOption('de');
    await expect(page.locator('header').getByText('Dashboard')).toBeVisible({ timeout: 5000 });
    // Sidebar nav items translate
    await expect(page.getByRole('link', { name: /startseite/i })).toBeVisible({ timeout: 5000 });
  });

  test('should translate the sidebar and stock section to Arabic', async ({ page }) => {
    await page.locator('header select').selectOption('ar');
    await expect(page.getByText('سوق الأسهم')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('الرئيسية')).toBeVisible({ timeout: 5000 });
  });

  test('should translate stock section heading to Spanish', async ({ page }) => {
    await page.locator('header select').selectOption('es');
    await expect(page.getByText('Bolsa de valores')).toBeVisible({ timeout: 5000 });
  });

  test('should translate logout button in sidebar', async ({ page }) => {
    await page.locator('header select').selectOption('de');
    await expect(page.locator('aside').getByRole('button', { name: /abmelden/i })).toBeVisible({ timeout: 5000 });
  });
});
