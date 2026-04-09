import { test, expect } from '@playwright/test';
import { mockLoginSuccess, mockLoginFailure, clearAuthState } from './helpers';

// helpers.ts no longer exports clearAuthState – define it inline
async function clearAuth(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

test.describe('Login Page', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    await page.goto('/login');
  });

  test('should display the login form', async ({ page }) => {
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show required validation on blur when form is empty', async ({ page }) => {
    // Blur username field to mark it touched
    await page.getByPlaceholder('Enter your username').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByText('Username is required')).toBeVisible();

    // Blur password field to mark it touched
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

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Enter your password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // The toggle is the only button[type="button"] in the form
    const toggleBtn = page.locator('button[type="button"]');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show error banner on invalid credentials', async ({ page }) => {
    await mockLoginFailure(page);

    await page.getByPlaceholder('Enter your username').fill('wronguser');
    await page.getByPlaceholder('Enter your password').fill('wrongpass');

    const responsePromise = page.waitForResponse('**/api/auth/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await responsePromise;

    await expect(page.getByText('Invalid username or password.')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to /dashboard on successful login', async ({ page }) => {
    await mockLoginSuccess(page);

    await page.getByPlaceholder('Enter your username').fill('testuser');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard/home');
  });

  test('should disable Sign In button when form is invalid', async ({ page }) => {
    const btn = page.getByRole('button', { name: /sign in/i });
    await expect(btn).toBeDisabled();

    await page.getByPlaceholder('Enter your username').fill('user');
    await expect(btn).toBeDisabled();

    await page.getByPlaceholder('Enter your password').fill('pass1');
    await expect(btn).toBeEnabled();
  });

  test('should stay on /dashboard if already logged in', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'existing-token');
      localStorage.setItem('user', 'existinguser');
    });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });
});
