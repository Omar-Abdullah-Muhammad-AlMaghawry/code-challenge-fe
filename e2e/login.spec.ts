import { test, expect } from '@playwright/test';
import { clearAuthState, mockLoginSuccess, mockLoginFailure, MOCK_TOKEN } from './helpers';

test.describe('Login Page', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/login');
  });

  // ── Rendering ────────────────────────────────────────────────────────────────

  test('should display the login form', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show a link to the register page', async ({ page }) => {
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible();
  });

  test('should navigate to /register when the register link is clicked', async ({ page }) => {
    await page.getByRole('link', { name: /create one/i }).click();
    await expect(page).toHaveURL('/register');
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  test('should show required errors when fields are blurred while empty', async ({ page }) => {
    await page.getByPlaceholder('Enter your username').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByText('Username is required')).toBeVisible();

    await page.getByPlaceholder('Enter your password').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show minlength error when password is too short', async ({ page }) => {
    await page.getByPlaceholder('Enter your username').fill('user');
    await page.getByPlaceholder('Enter your password').fill('123');
    await page.getByPlaceholder('Enter your password').blur();
    await expect(page.getByText('Password must be at least 4 characters')).toBeVisible();
  });

  test('should keep Sign In button disabled until form is valid', async ({ page }) => {
    const btn = page.getByRole('button', { name: /sign in/i });
    await expect(btn).toBeDisabled();

    await page.getByPlaceholder('Enter your username').fill('user');
    await expect(btn).toBeDisabled();

    await page.getByPlaceholder('Enter your password').fill('pass1');
    await expect(btn).toBeEnabled();
  });

  // ── Interaction ──────────────────────────────────────────────────────────────

  test('should toggle password visibility', async ({ page }) => {
    const input     = page.getByPlaceholder('Enter your password');
    const toggleBtn = page.locator('button[type="button"]');

    await expect(input).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(input).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('should show error banner on invalid credentials', async ({ page }) => {
    await mockLoginFailure(page);

    await page.getByPlaceholder('Enter your username').fill('wronguser');
    await page.getByPlaceholder('Enter your password').fill('wrongpass');

    await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    await expect(page.getByText('Invalid username or password.')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to /dashboard/home on successful login', async ({ page }) => {
    await mockLoginSuccess(page);

    await page.getByPlaceholder('Enter your username').fill('testuser');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard/home', { timeout: 8000 });
  });

  test('should stay on /dashboard if already logged in', async ({ page }) => {
    const validToken = MOCK_TOKEN;
    await page.addInitScript((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user',  'existinguser');
    }, validToken);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  // ── Language selector ────────────────────────────────────────────────────────

  test('should show the language selector with all 4 options', async ({ page }) => {
    const selector = page.locator('select');
    await expect(selector).toBeVisible();
    await expect(selector.locator('option')).toHaveCount(4);
  });
});
