// tests/pages/products.page.ts
import type { Locator, Page } from '@playwright/test';
import { ProductPage } from './product.page';

export class ProductCard {
  readonly name: Locator;
  readonly price: Locator;

  constructor(readonly root: Locator) {
    this.name = root.getByTestId('all-products-header');
    this.price = root.getByTestId('all-products-price');
  }
}

export class ProductsPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly resultsCount: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('all-products-title');
    this.searchInput = page.getByTestId('all-products-search-input');
    this.resultsCount = page.getByTestId('all-products-results-count');
  }

  async goto(): Promise<void> {
    await this.page.goto('/products', { waitUntil: 'domcontentloaded' });
    await this.heading.waitFor({ state: 'visible' });
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  /** A product card, found by the link that wraps the whole card. */
  productCard(name: string): ProductCard {
    return new ProductCard(this.page.getByRole('link', { name: new RegExp(`^${escapeRegExp(name)}`) }));
  }

  async openProduct(name: string): Promise<ProductPage> {
    await this.productCard(name).root.click();
    await this.page.waitForURL('**/product/**');
    const product = new ProductPage(this.page);
    await product.waitUntilReady();
    return product;
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
