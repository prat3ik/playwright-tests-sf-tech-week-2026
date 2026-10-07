// tests/auth/login.spec.ts
// Flow recorded with playwright-cli (snapshot → fill/click by ref), then
// assembled per playwright-skill/playwright-cli/test-generation.md and
// core/auth-flows.md (Recipe 1: Basic Login, Recipe 8: Logout).
import { test, expect } from '../fixtures';
import { createUserData, fullName } from '../factories/user.factory';

test.describe('Login', () => {
  test('user can log in with valid credentials @smoke', async ({ homePage, loginPage, registeredUser }) => {
    // The store picks the post-login destination from where the user came,
    // so the happy path enters through the header like a real visitor.
    await homePage.goto();
    await homePage.gotoLoginViaHeader();
    await loginPage.waitUntilReady();

    const home = await loginPage.loginAs(registeredUser.email, registeredUser.password);

    await expect(home.heroHeading).toBeVisible();
    expect(await home.sessionToken()).toBeTruthy();

    const account = await home.openAccount();
    await expect(account.profileName).toHaveText(fullName(registeredUser));
    await expect(account.profileEmail(registeredUser.email)).toBeVisible();
  });

  test('should reject a wrong password', async ({ loginPage, registeredUser }) => {
    await loginPage.goto();
    await loginPage.waitUntilReady();

    await loginPage.loginExpectingError(registeredUser.email, 'not-the-password');

    await expect(loginPage.errorToast).toHaveText('Invalid credentials');
    await expect(loginPage.heading).toBeVisible();
    expect(await loginPage.sessionToken()).toBeNull();
  });

  test('should reject an unregistered email', async ({ loginPage }) => {
    const stranger = createUserData();
    await loginPage.goto();
    await loginPage.waitUntilReady();

    await loginPage.loginExpectingError(stranger.email, stranger.password);

    await expect(loginPage.errorToast).toHaveText('Invalid credentials');
    await expect(loginPage.heading).toBeVisible();
  });

  test('user can toggle password visibility', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.waitUntilReady();
    await loginPage.fillCredentials('someone@example.com', 'secret');

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should link to the sign-up page', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.waitUntilReady();

    await loginPage.gotoSignUp();

    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('user can log out and the session is cleared', async ({ homePage, loginPage, registeredUser }) => {
    await homePage.goto();
    await homePage.gotoLoginViaHeader();
    await loginPage.waitUntilReady();
    const home = await loginPage.loginAs(registeredUser.email, registeredUser.password);
    const account = await home.openAccount();

    await account.logout();

    await loginPage.waitUntilReady();
    await expect(loginPage.heading).toBeVisible();
    expect(await loginPage.sessionToken()).toBeNull();
  });
});
