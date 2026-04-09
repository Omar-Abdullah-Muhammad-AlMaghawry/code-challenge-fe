import { test, expect } from '@playwright/test';
import { clearAuthState, mockRegisterSuccess, mockRegisterFailure } from './helpers';

test.describe('Register Page', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
    await page.goto('/register');
  });

  // ── Rendering ────────────────────────────────────────────────────────────────

  test('should display the register form', async ({ page }) => {
    await expect(page.getByText('Create Account')).toBeVisible();
    await expect(page.getByText('Sign up to get started')).toBeVisible();
    await expect(page.getByPlaceholder('Choose a username')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByPlaceholder('Repeat your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should show a link back to the login page', async ({ page }) => {
    await expect(page.getByText('Already have an account?')).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('should navigate to /login when the sign in link is clicked', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  // ── Validation ───────────────────────────────────────────────────────────────

  test('should show required errors when fields are blurred while empty', async ({ page }) => {
    await page.getByPlaceholder('Choose a username').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByText('Username is required')).toBeVisible();

    await page.getByPlaceholder('Create a password').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show minlength error for username shorter than 3 chars', async ({ page }) => {
    await page.getByPlaceholder('Choose a username').fill('ab');
    await page.getByPlaceholder('Choose a username').blur();
    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
  });

  test('should show minlength error for password shorter than 4 chars', async ({ page }) => {
    await page.getByPlaceholder('Create a password').fill('123');
    await page.getByPlaceholder('Create a password').blur();
    await expect(page.getByText('Password must be at least 4 characters')).toBeVisible();
  });

  test('should show password mismatch error', async ({ page }) => {
    await page.getByPlaceholder('Create a password').fill('secret123');
    await page.getByPlaceholder('Repeat your password').fill('different');
    await page.getByPlaceholder('Repeat your password').blur();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should keep Create Account button disabled when form is invalid', async ({ page }) => {
    const btn = page.getByRole('button', { name: /create account/i });
    await expect(btn).toBeDisabled();

    await page.getByPlaceholder('Choose a username').fill('newuser');
    await page.getByPlaceholder('Create a password').fill('pass1234');
    await expect(btn).toBeDisabled(); // confirmPassword still empty

    await page.getByPlaceholder('Repeat your password').fill('pass1234');
    await expect(btn).toBeEnabled();
  });

  test('should keep button disabled when passwords do not match', async ({ page }) => {
    await page.getByPlaceholder('Choose a username').fill('newuser');
    await page.getByPlaceholder('Create a password').fill('pass1234');
    await page.getByPlaceholder('Repeat your password').fill('different');
    await expect(page.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  // ── Interaction ──────────────────────────────────────────────────────────────

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Create a password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // First button[type="button"] is the password toggle
    await page.locator('button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.locator('button[type="button"]').first().click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should toggle confirm-password visibility', async ({ page }) => {
    const confirmInput = page.getByPlaceholder('Repeat your password');
    await expect(confirmInput).toHaveAttribute('type', 'password');

    // Second button[type="button"] is the confirm-password toggle
    await page.locator('button[type="button"]').nth(1).click();
    await expect(confirmInput).toHaveAttribute('type', 'text');
  });

  test('should show success banner and redirect to /login on success', async ({ page }) => {
    await mockRegisterSuccess(page);

    await page.getByPlaceholder('Choose a username').fill('newuser');
    await page.getByPlaceholder('Create a password').fill('pass1234');
    await page.getByPlaceholder('Repeat your password').fill('pass1234');

    await Promise.all([
      page.waitForResponse('**/api/auth/register'),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);

    await expect(page.getByText('Account created!')).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('should show error banner on registration failure', async ({ page }) => {
    await mockRegisterFailure(page);

    await page.getByPlaceholder('Choose a username').fill('takenuser');
    await page.getByPlaceholder('Create a password').fill('pass1234');
    await page.getByPlaceholder('Repeat your password').fill('pass1234');

    await Promise.all([
      page.waitForResponse('**/api/auth/register'),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);

    await expect(page.getByText('Registration failed.')).toBeVisible({ timeout: 5000 });
  });

  // ── Language selector ────────────────────────────────────────────────────────

  test('should show the language selector with all 4 options', async ({ page }) => {
    const selector = page.locator('select');
    await expect(selector).toBeVisible();
    await expect(selector.locator('option')).toHaveCount(4);
  });
});
