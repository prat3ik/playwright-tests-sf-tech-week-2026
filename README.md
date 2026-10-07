# playwright-tests-sf-tech-week-2026

End-to-end tests for the TestDino demo store (https://storedemo.testdino.com),
built with [Playwright Test](https://playwright.dev) and structured according to
the [TestDino playwright-skill](https://github.com/testdino-hq/playwright-skill)
guides, which are installed in this repo under `.agents/skills/playwright-skill`
(symlinked into `.claude/skills` for Claude Code).

## Quick start

```bash
npm install
cp .env.example .env     # optional, defaults target the public demo store
npm test                 # whole suite
npm run test:smoke       # only @smoke-tagged tests
npm run test:login       # the login spec
npm run test:checkout    # the checkout journey
npm run test:checkout:video   # same, recorded with on-screen labels (see below)
npm run report           # open the HTML report
```

## Recording a video with labels

Playwright 1.63 can annotate a recorded video natively, so a reviewer can see
what the test is doing without reading the code. This repo turns that on with
`VIDEO=1`:

```bash
VIDEO=1 npx playwright test tests/checkout     # or: npm run test:checkout:video
npx playwright show-report                     # the video is attached to the test
```

Three native pieces are combined (nothing is injected by hand):

| Feature | Where | What the viewer sees |
| --- | --- | --- |
| `video.show.actions` | `playwright.config.ts` | Each element the test interacts with is highlighted, with the action title (`click`, `fill`, `expect.toHaveText` …) and an animated pointer |
| `video.show.test` with `level: 'step'` | `playwright.config.ts` | The spec file, describe, test title and the live `test.step()` stack, top-left |
| `page.screencast.showChapter()` / `showOverlay()` | `tests/support/video-narration.ts` | A chapter card between phases of the journey, and an assertion card that shows the exact `expect()` lines about to run |

The `narrator` fixture is silent when video is off, so the same spec runs
unchanged (and about four times faster) in a normal run.

A recording of the checkout journey lives in `docs/demo/` (`checkout-journey.webm`
is the raw Playwright output; the `.gif` is a lighter preview for pull requests).

### Browser note (macOS 13)

Playwright 1.63 does not ship a bundled Chromium for macOS 13, so the config
launches the installed Google Chrome (`channel: "chrome"`). Elsewhere:

```bash
npx playwright install chromium
BROWSER_CHANNEL=chromium npm test
```

## Layout

The layout follows `pom/page-object-model.md` (Pattern 7) and
`core/test-organization.md` (feature-based structure):

```
playwright.config.ts          Baseline from core/configuration.md, no webServer (remote target)
tests/
  fixtures.ts                 Custom `test`: page-object fixtures + worker-scoped seeded user
  auth/
    login.spec.ts             Login scenarios
  checkout/
    checkout-journey.spec.ts  Find → detail → cart → sign in → checkout → order
  pages/                      One page object per route, actions only, no assertions
    home.page.ts
    login.page.ts
    account.page.ts
    products.page.ts          Listing + search; productCard(name) → { name, price }
    product.page.ts
    checkout.page.ts
    order-status.page.ts
  components/
    header.component.ts       Scoped to the header's root Locator
    cart-drawer.component.ts  The slide-in cart, present on every page
  factories/
    user.factory.ts           Unique user data, one place that owns the shape
  support/
    store-api.ts              API seeding (POST /api/register)
    demo-user.ts              Hard-coded checkout account + address, registered on first use
    store-workarounds.ts      Explicit, opt-in workarounds for demo-store defects
    video-narration.ts        Chapter and assertion cards for recorded videos
docs/demo/                    Recorded checkout journey (.webm + .gif)
```

## Skill rules applied, and where

| Guide | Rule | Where it shows up |
| --- | --- | --- |
| SKILL.md golden rules | `getByRole()` first, no `waitForTimeout`, web-first assertions, `baseURL` in config, fixtures over globals | Everywhere |
| core/locator-strategy.md | Test IDs only when there is no semantic role | `header.component.ts` (bare `<svg>` icons); everything else uses role, label, or text |
| pom/page-object-model.md | Locators `readonly`, methods are user actions, assertions stay in tests, navigation returns the next page object | `login.page.ts` `loginAs()` returns `HomePage`; `home.page.ts` `openAccount()` returns `AccountPage` |
| pom/page-object-model.md | `waitFor` inside a page object is synchronisation, not assertion | `LoginPage.waitUntilReady()` |
| core/fixtures-and-hooks.md | Worker-scoped fixture for an expensive, shareable resource | `registeredUser` in `fixtures.ts` |
| core/test-data-management.md | Factory + API seeding over UI setup | `user.factory.ts`, `store-api.ts` |
| core/configuration.md | Retries 2 in CI / 0 locally, `trace: on-first-retry`, `forbidOnly`, `.env.example` committed | `playwright.config.ts` |
| core/test-organization.md | `kebab-case.spec.ts`, Title Case describe, `should` / `user can` titles, `@smoke` tag | `login.spec.ts` |
| playwright-cli/test-generation.md | Snapshot first, act by ref, collect the emitted code, then add assertions | How the locators were discovered (below) |

## How playwright-cli was used

The flow was driven interactively before any code was written:

```bash
playwright-cli -s=skill open https://storedemo.testdino.com/ --browser=chrome
playwright-cli -s=skill snapshot          # find refs
playwright-cli -s=skill click e61         # → await page.getByTestId('header-user-icon').click();
playwright-cli -s=skill snapshot
playwright-cli -s=skill fill e2729 "…"    # → await page.getByTestId('login-email-input').fill('…');
playwright-cli -s=skill fill e2734 "…"    # → await page.getByTestId('login-password-input').fill('…');
playwright-cli -s=skill click e2736       # → await page.getByRole('button', { name: 'eye' }).click();
playwright-cli -s=skill click e2741       # Sign in
playwright-cli -s=skill requests          # POST /api/login → 200, 401 on bad credentials
```

The CLI emits `getByTestId()` wherever the markup carries a `data-testid`.
Per the skill's locator hierarchy those were upgraded to `getByRole()` /
`getByLabel()` where the element has an accessible role (inputs, buttons,
headings, the `role="status"` toast) and kept as test IDs only for the
header's unlabeled SVG icons.

## Login suite

| Test | Checks |
| --- | --- |
| user can log in with valid credentials `@smoke` | Header icon → login → back on home, token stored, account shows name and email |
| should reject a wrong password | "Invalid credentials" toast, still on login, no token |
| should reject an unregistered email | Same rejection path |
| user can toggle password visibility | Eye button flips `type` between `password` and `text` |
| should link to the sign-up page | Lands on `/signup` with the Create Account button |
| user can log out and the session is cleared | Account "Log Out" returns to login and clears the token |

## Checkout journey

One test, seven `test.step()`s. The price read from the product card is
carried through the whole journey and asserted on every screen.

| Step | Assertions |
| --- | --- |
| Find the product on the listing page | Search shows `Showing 1 products`; the card has the product name and a `$` price |
| Open the product and check the detail page | URL is `/product/jbl-charge-4-bluetooth-speaker`; name and price equal the listing; quantity is 1 |
| Add the product to the cart | `Added to the cart` toast; header badge shows `1` |
| Open the cart and verify the price | Item name, quantity 1, item price, subtotal and total equal the listed price; shipping is `Free` |
| Checkout asks a guest to sign in | Redirect to `/login`; the cart badge still shows `1`; after login the cart is intact |
| Review the order on the checkout page | Order summary name, `Qty: 1`, price, subtotal, total equal the listed price; Place Order is enabled |
| Place the order and verify the confirmation | URL is `/status/<orderId>`; the ID is a unique 24-hex string shown on the page; `Your order was placed successfully`; item price and amount charged equal the listed price; the cart is empty |

The order ID is also attached to the test as an annotation, so it shows in
the HTML report.

## Application behaviour worth knowing

- **There is no guest checkout.** The cart drawer's Checkout button sends a
  signed-out visitor to `/login` and keeps the cart. The checkout journey
  signs in with the hard-coded account in `support/demo-user.ts` at that point.
- **Place Order silently fails without a workaround.** The store's API client
  attaches the `Authorization` header to `POST /api/createOrder` only from the
  `admin_auth_token` slot, while a shopper's login stores the token under
  `user_access_token`. The API answers `401 Token Missing` and the UI shows
  nothing. `support/store-workarounds.ts` forwards the shopper's own token on
  that single request via `page.route()`; the test calls it explicitly in the
  Place Order step.
- **Product deep links do not render.** Opening `/product/<slug>` directly
  leaves the page blank; navigating from `/products` works. `ProductsPage.openProduct()`
  always goes through the listing.
- **The saved address loads late.** On `/checkout` the Place Order button
  renders before the address section is fetched, so `CheckoutPage.ensureShippingAddress()`
  waits for either the form or the saved card before deciding what to do.

- **Post-login redirect depends on entry point.** Reaching `/login` via the
  header icon returns the user to the store home. Opening `/login` directly
  redirects to `/checkout`. Happy-path tests use the header route.
- **The login view is lazy-loaded.** It can sit behind a spinner for 10s or
  more on a cold hit, which is why `LoginPage.waitUntilReady()` allows 30s.
- **Navigation waits for DOM content.** The store keeps requests open after
  first paint, so waiting for `load` is unreliable. Page objects follow
  `goto()` with a wait on a meaningful element instead.
- **Test users are registered through the API** once per worker and never
  deleted, because the demo API exposes no delete endpoint. Emails are unique
  per run.
