import { test, expect } from '@playwright/test';
import { openSmartCRM, pause } from './helpers';

test.describe('Authentication Flow', () => {
  test('login page loads correctly', async ({ page }) => {
    await openSmartCRM(page);

    await expect(page.getByText('Smart CRM')).toBeVisible();
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByLabelText(/email/i)).toBeVisible();
    await expect(page.getByLabelText(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login form accepts input credentials', async ({ page }) => {
    await openSmartCRM(page);

    const emailInput = page.getByLabelText(/email/i);
    const passwordInput = page.getByLabelText(/password/i);

    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('sign in button is disabled during loading', async ({ page }) => {
    await openSmartCRM(page);

    const emailInput = page.getByLabelText(/email/i);
    const passwordInput = page.getByLabelText(/password/i);
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(page.getByText('Signing in...')).toBeVisible();

    await pause(page, 2000);
  });

  test('forgot password link is present', async ({ page }) => {
    await openSmartCRM(page);

    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute('href', '/auth/recovery');
  });

  test('signup link is present', async ({ page }) => {
    await openSmartCRM(page);

    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toHaveAttribute('href', '/signup');
  });
});
