// tests/components/cart-drawer.component.ts
// The cart is a slide-in drawer that stays in the DOM on every page, so it is
// a component scoped to its root rather than a page object.
import type { Locator, Page } from '@playwright/test';

export class CartDrawerComponent {
  readonly root: Locator;
  readonly itemCount: Locator;
  readonly itemName: Locator;
  readonly itemPrice: Locator;
  readonly itemQuantity: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('cart-drawer');
    this.itemCount = page.getByTestId('header-cart-count');
    this.itemName = this.root.getByTestId('cart-item-header');
    this.itemPrice = this.root.getByTestId('item-price');
    this.itemQuantity = this.root.getByTestId('item-quantity');
    this.subtotal = this.root.getByTestId('subtotal-value');
    this.shipping = this.root.getByTestId('shipping-value');
    this.total = this.root.getByTestId('total-value');
    this.checkoutButton = this.root.getByTestId('checkout-button');
  }

  async open(): Promise<void> {
    await this.page.getByTestId('header-cart-icon').click();
    await this.checkoutButton.waitFor({ state: 'visible' });
  }

  /** Signed out: lands on /login. Signed in: lands on /checkout. */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await this.page.waitForURL(/\/(login|checkout)$/);
  }
}
