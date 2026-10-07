// tests/checkout/checkout-journey.spec.ts
// One shopper journey, end to end: find a product, verify it, add it to the
// cart, sign in when the store asks for it, place the order, and prove the
// price never changed along the way.
//
// The store has no guest checkout: the Checkout button sends a signed-out
// visitor to /login and keeps the cart. The test signs in with the hard-coded
// demo account at exactly that point, like a real visitor would.
//
// Run with video to get a narrated recording (see README "Recording a video"):
//   VIDEO=1 npx playwright test tests/checkout
import { test, expect } from '../fixtures';
import { demoAddress } from '../support/demo-user';
import { forwardUserTokenToOrderApi } from '../support/store-workarounds';

const PRODUCT = 'JBL Charge 4 Bluetooth Speaker';
const SEARCH_TERM = 'JBL';

test.describe('Checkout journey', () => {
  test('shopper can find a product, add it to the cart and place an order at the listed price @smoke', async ({
    page,
    productsPage,
    cartDrawer,
    loginPage,
    checkoutPage,
    checkoutUser,
    narrator,
  }) => {
    // Seven steps on a slow demo site, plus narration pauses when recording.
    test.slow();

    // The price shown on the product card. Every later screen must match it.
    let listedPrice = '';

    await test.step('Find the product on the listing page', async () => {
      await narrator.chapter('1 · Find the product', `Search "${SEARCH_TERM}" on All Products and check the card`);
      await productsPage.goto();
      await productsPage.search(SEARCH_TERM);

      const card = productsPage.productCard(PRODUCT);
      await narrator.assertion(
        'the search narrows the list to one product and the card shows its name and a price',
        `await expect(productsPage.resultsCount).toHaveText('Showing 1 products');\nawait expect(card.name).toHaveText('${PRODUCT}');\nawait expect(card.price).toHaveText(/^\\$\\d+$/);`,
      );
      await expect(productsPage.resultsCount).toHaveText('Showing 1 products');
      await expect(card.name).toHaveText(PRODUCT);
      await expect(card.price).toHaveText(/^\$\d+$/);
      listedPrice = (await card.price.innerText()).trim();
    });

    const product = await test.step('Open the product and check the detail page', async () => {
      await narrator.chapter('2 · Product detail page', 'Same name and the same price as the listing');
      const product = await productsPage.openProduct(PRODUCT);

      await narrator.assertion(
        'the detail page shows the same product at the listed price',
        `await expect(page).toHaveURL(/\\/product\\/jbl-charge-4-bluetooth-speaker$/);\nawait expect(product.name).toHaveText('${PRODUCT}');\nawait expect(product.price).toHaveText(listedPrice); // ${listedPrice}`,
      );
      await expect(page).toHaveURL(/\/product\/jbl-charge-4-bluetooth-speaker$/);
      await expect(product.name).toHaveText(PRODUCT);
      await expect(product.price).toHaveText(listedPrice);
      await expect(product.quantity).toHaveText('1');
      return product;
    });

    await test.step('Add the product to the cart', async () => {
      await narrator.chapter('3 · Add to cart', 'Click ADD TO CART and watch the toast and the header badge');
      // The toast lives for two seconds, so the card goes up before the click.
      await narrator.assertion(
        'the store confirms the add and the cart badge shows one item',
        `await expect(product.addedToast).toBeVisible();\nawait expect(cartDrawer.itemCount).toHaveText('1');`,
      );
      await product.addToCart();

      await expect(product.addedToast).toBeVisible();
      await expect(cartDrawer.itemCount).toHaveText('1');
    });

    await test.step('Open the cart and verify the price', async () => {
      await narrator.chapter('4 · Cart drawer', 'Item price, subtotal and total must all equal the listed price');
      await cartDrawer.open();

      await narrator.assertion(
        'the cart holds the product once, priced exactly as listed, with free shipping',
        `await expect(cartDrawer.itemName).toHaveText('${PRODUCT}');\nawait expect(cartDrawer.itemQuantity).toHaveText('1');\nawait expect(cartDrawer.itemPrice).toHaveText(listedPrice); // ${listedPrice}\nawait expect(cartDrawer.subtotal).toHaveText(listedPrice);\nawait expect(cartDrawer.shipping).toHaveText('Free');\nawait expect(cartDrawer.total).toHaveText(listedPrice);`,
      );
      await expect(cartDrawer.itemName).toHaveText(PRODUCT);
      await expect(cartDrawer.itemQuantity).toHaveText('1');
      await expect(cartDrawer.itemPrice).toHaveText(listedPrice);
      await expect(cartDrawer.subtotal).toHaveText(listedPrice);
      await expect(cartDrawer.shipping).toHaveText('Free');
      await expect(cartDrawer.total).toHaveText(listedPrice);
    });

    await test.step('Checkout asks a guest to sign in', async () => {
      await narrator.chapter('5 · Checkout → sign in', 'No guest checkout here: the store redirects to /login and keeps the cart');
      await cartDrawer.proceedToCheckout();

      await narrator.assertion(
        'a signed-out shopper is sent to the login page and the cart survives',
        `await expect(page).toHaveURL(/\\/login$/);\nawait expect(cartDrawer.itemCount).toHaveText('1');`,
      );
      await expect(page).toHaveURL(/\/login$/);
      await expect(cartDrawer.itemCount).toHaveText('1');

      await loginPage.waitUntilReady();
      await loginPage.loginAs(checkoutUser.email, checkoutUser.password);
      await expect(cartDrawer.itemCount).toHaveText('1');
    });

    await test.step('Review the order on the checkout page', async () => {
      await narrator.chapter('6 · Checkout page', 'Shipping address, payment method and an order summary at the same price');
      await cartDrawer.open();
      await cartDrawer.proceedToCheckout();
      await checkoutPage.waitUntilReady();
      await checkoutPage.ensureShippingAddress(demoAddress);
      await checkoutPage.chooseCashOnDelivery();

      await narrator.assertion(
        'the order summary still prices the product as listed',
        `await expect(checkoutPage.summaryProductName).toHaveText('${PRODUCT}');\nawait expect(checkoutPage.summaryProductQuantity).toHaveText('Qty: 1');\nawait expect(checkoutPage.summaryProductPrice).toHaveText(listedPrice); // ${listedPrice}\nawait expect(checkoutPage.total).toHaveText(listedPrice);\nawait expect(checkoutPage.placeOrderButton).toBeEnabled();`,
      );
      await expect(page).toHaveURL(/\/checkout$/);
      await expect(checkoutPage.summaryProductName).toHaveText(PRODUCT);
      await expect(checkoutPage.summaryProductQuantity).toHaveText('Qty: 1');
      await expect(checkoutPage.summaryProductPrice).toHaveText(listedPrice);
      await expect(checkoutPage.subtotal).toHaveText(listedPrice);
      await expect(checkoutPage.shipping).toHaveText('Free');
      await expect(checkoutPage.total).toHaveText(listedPrice);
      await expect(checkoutPage.placeOrderButton).toBeEnabled();
    });

    await test.step('Place the order and verify the confirmation', async () => {
      await narrator.chapter('7 · Place the order', 'A unique order ID, and the amount charged equals the listed price');
      // Demo-store defect: the order request drops the shopper's token.
      await forwardUserTokenToOrderApi(page);
      const status = await checkoutPage.placeOrder();

      const orderId = status.orderIdFromUrl();
      test.info().annotations.push({ type: 'order-id', description: orderId });

      await narrator.assertion(
        'the order has a unique 24-hex ID shown on the page and in the URL, and was charged the listed price',
        `expect(orderId).toMatch(/^[a-f0-9]{24}$/);\nawait expect(status.orderId).toHaveText(\`Order ID: \${orderId}\`);\nawait expect(status.placedMessage).toHaveText('Your order was placed successfully');\nawait expect(status.paymentAmount).toHaveText(listedPrice); // ${listedPrice}\nawait expect(status.itemPrice).toHaveText(listedPrice);`,
      );
      expect(orderId).toMatch(/^[a-f0-9]{24}$/);
      await expect(page).toHaveURL(new RegExp(`/status/${orderId}$`));
      await expect(status.orderId).toHaveText(`Order ID: ${orderId}`);
      await expect(status.placedMessage).toHaveText('Your order was placed successfully');
      await expect(status.confirmedTitle).toHaveText('Your order is confirmed');
      await expect(status.itemName).toHaveText(PRODUCT);
      await expect(status.itemQuantity).toHaveText('Qty: 1');
      await expect(status.itemPrice).toHaveText(listedPrice);
      await expect(status.paymentAmount).toHaveText(listedPrice);
      // The order is fulfilled, so the cart must be empty again.
      await expect(cartDrawer.itemCount).toBeHidden();
    });
  });
});
