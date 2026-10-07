// tests/pages/order-status.page.ts
import type { Locator, Page } from '@playwright/test';

export class OrderStatusPage {
  readonly heading: Locator;
  readonly orderId: Locator;
  readonly placedMessage: Locator;
  readonly confirmedTitle: Locator;
  readonly paymentAmount: Locator;
  readonly itemName: Locator;
  readonly itemPrice: Locator;
  readonly itemQuantity: Locator;
  readonly summary: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('order-details-title');
    this.orderId = page.getByTestId('order-id');
    this.placedMessage = page.getByTestId('order-placed-message');
    this.confirmedTitle = page.getByTestId('order-confirmed-title');
    this.paymentAmount = page.getByTestId('payment-method-amount');
    this.itemName = page.getByTestId('order-item-name');
    this.itemPrice = page.getByTestId('order-item-price');
    this.itemQuantity = page.getByTestId('order-item-quantity');
    this.summary = page.getByTestId('order-summary-title').locator('..');
  }

  async waitUntilReady(): Promise<void> {
    await this.orderId.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** The 24-hex order ID from the URL: /status/<orderId>. */
  orderIdFromUrl(): string {
    return new URL(this.page.url()).pathname.split('/').pop() ?? '';
  }
}
