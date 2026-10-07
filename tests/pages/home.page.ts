// tests/pages/home.page.ts
import type { Locator, Page } from '@playwright/test';
import { HeaderComponent } from '../components/header.component';
import { AccountPage } from './account.page';

export class HomePage {
  readonly header: HeaderComponent;
  readonly heroHeading: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page.locator('header, body').first());
    this.heroHeading = page.getByRole('heading', { name: 'Demo E-commerce Testing Store' });
  }

  // The store keeps requests open after first paint, so the `load` event can
  // arrive late or not at all. DOM content is enough: every page object
  // follows navigation with a wait on a meaningful element.
  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  /** Signed-out: the user icon leads to the login view. */
  async gotoLoginViaHeader(): Promise<void> {
    await this.header.openUserMenu();
    await this.page.waitForURL('**/login');
  }

  /** Signed-in: the user icon leads to the account page. */
  async openAccount(): Promise<AccountPage> {
    await this.header.openUserMenu();
    await this.page.waitForURL('**/account');
    return new AccountPage(this.page);
  }

  async sessionToken(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('user_access_token'));
  }
}
