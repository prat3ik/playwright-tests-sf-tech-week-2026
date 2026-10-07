// tests/components/header.component.ts
// Component object (playwright-skill/pom/page-object-model.md, Pattern 2):
// takes the header's root Locator so queries are scoped to that subtree.
import type { Locator } from '@playwright/test';

export class HeaderComponent {
  readonly logo: Locator;
  readonly userIcon: Locator;
  readonly cartIcon: Locator;

  constructor(private readonly root: Locator) {
    // The header icons are bare <svg> elements with no accessible role or name,
    // so getByTestId() is the first semantic option available here.
    this.logo = root.getByTestId('header-logo');
    this.userIcon = root.getByTestId('header-user-icon');
    this.cartIcon = root.getByTestId('header-cart-icon');
  }

  /** Opens /login when signed out, /account when signed in. */
  async openUserMenu(): Promise<void> {
    await this.userIcon.click();
  }
}
