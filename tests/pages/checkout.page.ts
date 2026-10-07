// tests/pages/checkout.page.ts
import type { Locator, Page } from '@playwright/test';
import { OrderStatusPage } from './order-status.page';

export interface ShippingAddress {
  firstName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class CheckoutPage {
  readonly heading: Locator;
  readonly addressForm: Locator;
  readonly saveAddressButton: Locator;
  readonly savedAddress: Locator;
  readonly cashOnDeliveryButton: Locator;
  readonly summaryProductName: Locator;
  readonly summaryProductPrice: Locator;
  readonly summaryProductQuantity: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly placeOrderButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('checkout-title');
    this.addressForm = page.getByTestId('checkout-first-name-input');
    this.saveAddressButton = page.getByTestId('checkout-save-address-button');
    // The saved-address card has no test ID of its own; "Change" is its only control.
    this.savedAddress = page.getByRole('button', { name: 'Change' }).first();
    this.cashOnDeliveryButton = page.getByTestId('checkout-cod-button');
    this.summaryProductName = page.getByTestId('checkout-product-header');
    this.summaryProductPrice = page.getByTestId('checkout-product-price');
    this.summaryProductQuantity = page.getByTestId('checkout-product-quantity');
    this.subtotal = page.getByTestId('checkout-subtotal-value');
    this.shipping = page.getByTestId('checkout-shipping-value');
    this.total = page.getByTestId('checkout-total-value');
    this.placeOrderButton = page.getByTestId('checkout-place-order-button');
  }

  async waitUntilReady(): Promise<void> {
    await this.placeOrderButton.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * The store shows the address form only until the account has one saved.
   * The hard-coded demo user keeps its address between runs, so this fills
   * the form the first time and reuses the saved card afterwards.
   */
  async ensureShippingAddress(address: ShippingAddress): Promise<void> {
    // The address section is fetched after the rest of the page renders, so
    // wait for either outcome before deciding which one this run has.
    await this.addressForm.or(this.savedAddress).first().waitFor({ state: 'visible' });
    if (await this.savedAddress.isVisible()) return;
    await this.page.getByTestId('checkout-first-name-input').fill(address.firstName);
    await this.page.getByTestId('checkout-email-input').fill(address.email);
    await this.page.getByTestId('checkout-street-input').fill(address.street);
    await this.page.getByTestId('checkout-city-input').fill(address.city);
    await this.page.getByTestId('checkout-state-input').fill(address.state);
    await this.page.getByTestId('checkout-zip-code-input').fill(address.zipCode);
    await this.page.getByTestId('checkout-country-input').fill(address.country);
    await this.saveAddressButton.click();
    await this.savedAddress.waitFor({ state: 'visible' });
  }

  async chooseCashOnDelivery(): Promise<void> {
    await this.cashOnDeliveryButton.click();
  }

  /** Places the order and lands on /status/<orderId>. */
  async placeOrder(): Promise<OrderStatusPage> {
    await this.placeOrderButton.click();
    await this.page.waitForURL('**/status/**');
    const status = new OrderStatusPage(this.page);
    await status.waitUntilReady();
    return status;
  }
}
