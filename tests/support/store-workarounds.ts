// tests/support/store-workarounds.ts
// Known defects in the demo store that the tests route around on purpose.
// Each workaround is explicit and opt-in so a reviewer can see exactly where
// the test deviates from what a real visitor does.
import type { Page } from '@playwright/test';

/**
 * POST /api/createOrder is sent without an Authorization header.
 *
 * The store's API client only attaches the token stored under
 * `admin_auth_token`, while a shopper's login stores it under
 * `user_access_token`. The API then answers 401 "Token Missing" and the Place
 * Order button silently does nothing. This forwards the shopper's own token on
 * that single request, which is what the store should be doing itself.
 */
export async function forwardUserTokenToOrderApi(page: Page): Promise<void> {
  await page.route('**/api/createOrder', async (route) => {
    const token = await page.evaluate(() => localStorage.getItem('user_access_token'));
    await route.continue({
      headers: { ...route.request().headers(), authorization: `Bearer ${token}` },
    });
  });
}
