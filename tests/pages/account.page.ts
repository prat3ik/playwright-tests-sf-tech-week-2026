// tests/pages/account.page.ts
import type { Locator, Page } from '@playwright/test';

export class AccountPage {
  readonly profileCard: Locator;
  readonly profileName: Locator;
  readonly logoutMenuItem: Locator;

  constructor(private readonly page: Page) {
    // The profile card is a plain <div> container, so a test ID is the first
    // semantic hook available. Scoping to it keeps the heading lookup away
    // from the (hidden) cart drawer, which also renders an <h2>.
    this.profileCard = page.getByTestId('user-profile-card');
    this.profileName = this.profileCard.getByRole('heading', { level: 2 });
    this.logoutMenuItem = page.getByText('Log Out', { exact: true });
  }

  profileEmail(email: string): Locator {
    return this.profileCard.getByText(email, { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/account', { waitUntil: 'domcontentloaded' });
  }

  /** Ends the session; the store returns to /login. */
  async logout(): Promise<void> {
    await this.logoutMenuItem.click();
    await this.page.waitForURL('**/login');
  }
}
