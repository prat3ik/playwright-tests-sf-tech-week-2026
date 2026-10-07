// tests/fixtures.ts
// Custom `test` with page-object fixtures (pom guide, Pattern 4) and a
// worker-scoped seeded user (fixtures-and-hooks.md, Pattern 2 + API seeding).
// Every spec imports { test, expect } from here, never from @playwright/test.
import { test as base } from '@playwright/test';
import { CartDrawerComponent } from './components/cart-drawer.component';
import { createUserData, type UserData } from './factories/user.factory';
import { AccountPage } from './pages/account.page';
import { CheckoutPage } from './pages/checkout.page';
import { HomePage } from './pages/home.page';
import { LoginPage } from './pages/login.page';
import { ProductsPage } from './pages/products.page';
import { demoUser, ensureDemoUser } from './support/demo-user';
import { registerUser } from './support/store-api';
import { isVideoOn, Narrator } from './support/video-narration';

type PageObjects = {
  homePage: HomePage;
  loginPage: LoginPage;
  accountPage: AccountPage;
  productsPage: ProductsPage;
  checkoutPage: CheckoutPage;
  cartDrawer: CartDrawerComponent;
  /** Chapter and assertion cards for recorded videos; silent when video is off. */
  narrator: Narrator;
};

type WorkerFixtures = {
  /** A user that exists in the store, registered once per worker via the API. */
  registeredUser: UserData;
  /** The hard-coded checkout account, registered on first use. */
  checkoutUser: UserData;
};

export const test = base.extend<PageObjects, WorkerFixtures>({
  registeredUser: [
    async ({}, use) => {
      const { TEST_USER_EMAIL, TEST_USER_PASSWORD } = process.env;
      if (TEST_USER_EMAIL && TEST_USER_PASSWORD) {
        await use(createUserData({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }));
        return;
      }
      const user = createUserData();
      await registerUser(user);
      await use(user);
      // No teardown: the demo API exposes no delete endpoint. Emails are
      // unique per run, so leftover accounts never collide.
    },
    { scope: 'worker' },
  ],

  checkoutUser: [
    async ({}, use) => {
      await ensureDemoUser();
      await use(demoUser);
    },
    { scope: 'worker' },
  ],

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  cartDrawer: async ({ page }, use) => {
    await use(new CartDrawerComponent(page));
  },
  narrator: async ({ page }, use, testInfo) => {
    await use(new Narrator(page, isVideoOn(testInfo)));
  },
});

export { expect } from '@playwright/test';
