// Generated from: e2e\features\checkout\payment-flow.feature
import { test } from "playwright-bdd";

test.describe('Payment Processing and Order Confirmation', () => {

  test('Payment session is created with the correct cart total', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D5', '@D8', '@regression'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await And('the user has filled in their delivery address', null, { page }); 
    await And('the user has selected a delivery slot', null, { page }); 
    await When('the user proceeds to the payment step', null, { page }); 
    await Then('a payment session is created', null, { page }); 
    await And('the payment session amount matches the cart total', null, { page }); 
  });

  test('Stripe PaymentIntent receives the correct amount in pence', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D5', '@regression'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await And('the user has filled in their delivery address', null, { page }); 
    await When('the user initiates a Stripe payment', null, { page }); 
    await Then('the Stripe PaymentIntent is created with the cart total in pence', null, { page }); 
    await And('the Stripe amount is NOT multiplied by 100', null, { page }); 
  });

  test('Cart completion creates an order and redirects to confirmation', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D10', '@regression'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has initiated a successful Stripe payment', null, { page }); 
    await When('the cart is completed', null, { page }); 
    await Then('an order is created in the system', null, { page }); 
    await And('the user is redirected to the order confirmation page', null, { page }); 
    await And('the confirmation URL contains "/order/" and "/confirmed"', null, { page }); 
  });

  test('Order confirmation page displays all required sections', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D10', '@regression'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the order confirmation page for a successfully placed order', null, { page }); 
    await Then('the page displays a green success indicator', null, { page }); 
    await And('the page displays the text "Order Confirmed"', null, { page }); 
    await And('the confirmation page displays the order number', null, { page }); 
    await And('the confirmation page displays a delivery ETA', null, { page }); 
    await And('the page displays the delivery address', null, { page }); 
    await And('the page displays the payment method used', null, { page }); 
    await And('the page lists the items ordered with their quantities', null, { page }); 
    await And('the page displays the order subtotal, shipping cost, and total', null, { page }); 
    await And('the page displays a "Continue Shopping" button', null, { page }); 
  });

  test('Order confirmation page does NOT show a 404 or blank page', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D10', '@regression'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the order confirmation page for a successfully placed order', null, { page }); 
    await Then('the page does NOT display "Page not found"', null, { page }); 
    await And('the page does NOT display "Go to frontpage"', null, { page }); 
    await And('the page content is longer than 100 characters', null, { page }); 
    await And('the page contains order-related content', null, { page }); 
  });

  test('Order confirmation page shows correct prices', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D10', '@regression'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the order confirmation page for a successfully placed order', null, { page }); 
    await Then('all prices on the page are displayed in GBP format with two decimal places', null, { page }); 
    await And('the order total matches the sum of subtotal and shipping', null, { page }); 
  });

  test('Payment amount is consistent across frontend, backend, and Stripe', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@D8', '@regression'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user completes the full checkout and payment flow', null, { page }); 
    await Then('the amount displayed on the Pay button matches the cart total divided by 100', null, { page }); 
    await And('the amount sent to Stripe matches the cart total in pence', null, { page }); 
    await And('no price is multiplied by 100 at any stage', null, { page }); 
  });

  test('User navigates from confirmation back to store', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@navigation'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the order confirmation page', null, { page }); 
    await When('the user clicks "Continue Shopping"', null, { page }); 
    await Then('the user is navigated to the store page', null, { page }); 
  });

  test('User navigates from confirmation to order history', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@navigation'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the order confirmation page', null, { page }); 
    await When('the user clicks "View your order"', null, { page }); 
    await Then('the user is navigated to the order history page', null, { page }); 
  });

  test('User navigates from confirmation to create account', { tag: ['@W03', '@W05', '@payment', '@confirmation', '@critical-path', '@navigation'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the order confirmation page as a guest', null, { page }); 
    await When('the user clicks "Create Account"', null, { page }); 
    await Then('the user is navigated to the registration page', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\checkout\\payment-flow.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":28,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D5","@D8","@regression"],"steps":[{"pwStepLine":7,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"And the user has filled in their delivery address","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"And the user has selected a delivery slot","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When the user proceeds to the payment step","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then a payment session is created","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"And the payment session amount matches the cart total","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":37,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D5","@regression"],"steps":[{"pwStepLine":16,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"And the user has filled in their delivery address","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When the user initiates a Stripe payment","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the Stripe PaymentIntent is created with the cart total in pence","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And the Stripe amount is NOT multiplied by 100","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":45,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D10","@regression"],"steps":[{"pwStepLine":24,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given the user has initiated a successful Stripe payment","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When the cart is completed","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"Then an order is created in the system","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"And the user is redirected to the order confirmation page","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"And the confirmation URL contains \"/order/\" and \"/confirmed\"","stepMatchArguments":[{"group":{"start":30,"value":"\"/order/\"","children":[{"start":31,"value":"/order/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"},{"group":{"start":44,"value":"\"/confirmed\"","children":[{"start":45,"value":"/confirmed","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":31,"pickleLine":53,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D10","@regression"],"steps":[{"pwStepLine":32,"gherkinStepLine":54,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page for a successfully placed order","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":55,"keywordType":"Outcome","textWithKeyword":"Then the page displays a green success indicator","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":56,"keywordType":"Outcome","textWithKeyword":"And the page displays the text \"Order Confirmed\"","stepMatchArguments":[{"group":{"start":27,"value":"\"Order Confirmed\"","children":[{"start":28,"value":"Order Confirmed","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":57,"keywordType":"Outcome","textWithKeyword":"And the confirmation page displays the order number","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"And the confirmation page displays a delivery ETA","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"And the page displays the delivery address","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"And the page displays the payment method used","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":61,"keywordType":"Outcome","textWithKeyword":"And the page lists the items ordered with their quantities","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":62,"keywordType":"Outcome","textWithKeyword":"And the page displays the order subtotal, shipping cost, and total","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"And the page displays a \"Continue Shopping\" button","stepMatchArguments":[{"group":{"start":20,"value":"\"Continue Shopping\"","children":[{"start":21,"value":"Continue Shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":44,"pickleLine":66,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D10","@regression"],"steps":[{"pwStepLine":45,"gherkinStepLine":67,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page for a successfully placed order","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":68,"keywordType":"Outcome","textWithKeyword":"Then the page does NOT display \"Page not found\"","stepMatchArguments":[{"group":{"start":26,"value":"\"Page not found\"","children":[{"start":27,"value":"Page not found","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":47,"gherkinStepLine":69,"keywordType":"Outcome","textWithKeyword":"And the page does NOT display \"Go to frontpage\"","stepMatchArguments":[{"group":{"start":26,"value":"\"Go to frontpage\"","children":[{"start":27,"value":"Go to frontpage","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":48,"gherkinStepLine":70,"keywordType":"Outcome","textWithKeyword":"And the page content is longer than 100 characters","stepMatchArguments":[{"group":{"start":32,"value":"100"},"parameterTypeName":"int"}]},{"pwStepLine":49,"gherkinStepLine":71,"keywordType":"Outcome","textWithKeyword":"And the page contains order-related content","stepMatchArguments":[]}]},
  {"pwTestLine":52,"pickleLine":74,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D10","@regression"],"steps":[{"pwStepLine":53,"gherkinStepLine":75,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page for a successfully placed order","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":76,"keywordType":"Outcome","textWithKeyword":"Then all prices on the page are displayed in GBP format with two decimal places","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":77,"keywordType":"Outcome","textWithKeyword":"And the order total matches the sum of subtotal and shipping","stepMatchArguments":[]}]},
  {"pwTestLine":58,"pickleLine":80,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@D8","@regression"],"steps":[{"pwStepLine":59,"gherkinStepLine":81,"keywordType":"Context","textWithKeyword":"Given the user completes the full checkout and payment flow","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":82,"keywordType":"Outcome","textWithKeyword":"Then the amount displayed on the Pay button matches the cart total divided by 100","stepMatchArguments":[{"group":{"start":73,"value":"100"},"parameterTypeName":"int"}]},{"pwStepLine":61,"gherkinStepLine":83,"keywordType":"Outcome","textWithKeyword":"And the amount sent to Stripe matches the cart total in pence","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":84,"keywordType":"Outcome","textWithKeyword":"And no price is multiplied by 100 at any stage","stepMatchArguments":[]}]},
  {"pwTestLine":65,"pickleLine":91,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@navigation"],"steps":[{"pwStepLine":66,"gherkinStepLine":92,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page","stepMatchArguments":[]},{"pwStepLine":67,"gherkinStepLine":93,"keywordType":"Action","textWithKeyword":"When the user clicks \"Continue Shopping\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Continue Shopping\"","children":[{"start":17,"value":"Continue Shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":68,"gherkinStepLine":94,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to the store page","stepMatchArguments":[]}]},
  {"pwTestLine":71,"pickleLine":97,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@navigation"],"steps":[{"pwStepLine":72,"gherkinStepLine":98,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page","stepMatchArguments":[]},{"pwStepLine":73,"gherkinStepLine":99,"keywordType":"Action","textWithKeyword":"When the user clicks \"View your order\"","stepMatchArguments":[{"group":{"start":16,"value":"\"View your order\"","children":[{"start":17,"value":"View your order","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":74,"gherkinStepLine":100,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to the order history page","stepMatchArguments":[]}]},
  {"pwTestLine":77,"pickleLine":103,"tags":["@W03","@W05","@payment","@confirmation","@critical-path","@navigation"],"steps":[{"pwStepLine":78,"gherkinStepLine":104,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page as a guest","stepMatchArguments":[]},{"pwStepLine":79,"gherkinStepLine":105,"keywordType":"Action","textWithKeyword":"When the user clicks \"Create Account\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Create Account\"","children":[{"start":17,"value":"Create Account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":80,"gherkinStepLine":106,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to the registration page","stepMatchArguments":[]}]},
]; // bdd-data-end