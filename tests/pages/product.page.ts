// tests/pages/product.page.ts
import type { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly name: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly addedToast: Locator;

  constructor(private readonly page: Page) {
    const section = page.getByTestId('product-details-section');
    this.name = section.getByTestId('product-name');
    this.price = section.getByTestId('product-price');
    this.quantity = section.getByTestId('quantity-value');
    this.addToCartButton = section.getByTestId('add-to-cart-button');
    this.addedToast = page.getByRole('status').filter({ hasText: 'Added to the cart' });
  }

  /** The product view is a lazily loaded chunk; wait for its primary action. */
  async waitUntilReady(): Promise<void> {
    await this.addToCartButton.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }
}
