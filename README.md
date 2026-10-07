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
npm run report           # open the HTML report
```

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
  pages/                      One page object per route, actions only, no assertions
    home.page.ts
    login.page.ts
    account.page.ts
  components/
    header.component.ts       Scoped to the header's root Locator
  factories/
    user.factory.ts           Unique user data, one place that owns the shape
  support/
    store-api.ts              API seeding (POST /api/register)
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

## Application behaviour worth knowing

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
