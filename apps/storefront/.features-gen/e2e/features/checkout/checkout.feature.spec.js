// Generated from: e2e\features\checkout\checkout.feature
import { test } from "playwright-bdd";

test.describe('Checkout and Order Confirmation', () => {

  test('Checkout redirects when the basket is empty', { tag: ['@W03', '@W05', '@checkout', '@D5', '@regression'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has an empty basket', null, { page }); 
    await When('the user attempts to access the checkout page', null, { page }); 
    await Then('the user is redirected away from checkout', null, { page }); 
  });

  test('Address step shows all required fields', { tag: ['@W03', '@W05', '@checkout', '@D5'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await When('the user navigates to the checkout address step', null, { page }); 
    await Then('the address form includes fields for first name, last name, address, city, postcode, email, and phone', null, { page }); 
  });

  test('Postcode validation gate appears', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await When('the user navigates to the checkout address step', null, { page }); 
    await Then('a postcode validation gate is displayed', null, { page }); 
  });

  test('Valid London postcode passes the gate', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user enters a postcode of "E1 6AN"', null, { page }); 
    await Then('the postcode gate passes', null, { page }); 
    await And('the user can continue to shop', null, { page }); 
  });

  test('Invalid postcode shows a warning', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, Then, page }) => { 
    await Given('the user enters a postcode of "LS1 1AA"', null, { page }); 
    await Then('a warning is displayed that delivery may not be available', null, { page }); 
  });

  test('Address step validates required fields', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await And('the user is on the checkout address step', null, { page }); 
    await When('the user submits with missing required fields', null, { page }); 
    await Then('validation errors are displayed', null, { page }); 
  });

  test('Delivery slots are restricted to weekend days only', { tag: ['@W03', '@W05', '@checkout', '@D1', '@bugfix'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await And('the user has filled in their delivery address', null, { page }); 
    await When('the user proceeds to the delivery step', null, { page }); 
    await Then('only Saturday and Sunday dates are available for selection', null, { page }); 
  });

  test('Delivery slots display 4-hour time windows', { tag: ['@W03', '@W05', '@checkout', '@D1'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await And('the user has filled in their delivery address', null, { page }); 
    await When('the user proceeds to the delivery step', null, { page }); 
    await Then('three time windows are available covering morning, afternoon, and evening', null, { page }); 
  });

  test('Payment step shows Stripe card entry form', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await When('the user navigates to the payment step', null, { page }); 
    await Then('a card payment form is displayed', null, { page }); 
  });

  test('Payment form has a visible pay button', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await When('the user navigates to the payment step', null, { page }); 
    await Then('a pay button is displayed with the order total', null, { page }); 
  });

  test('Review step shows the full order summary', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the review step', null, { page }); 
    await Then('the order summary shows the items, shipping cost, and total', null, { page }); 
    await And('the delivery address is displayed', null, { page }); 
    await And('the selected delivery slot is displayed', null, { page }); 
  });

  test('Order confirmation page shows success message', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user has just placed an order', null, { page }); 
    await Then('the confirmation page displays a green checkmark', null, { page }); 
    await And('the confirmation page displays a "Thank you" message', null, { page }); 
    await And('the confirmation page displays the order number', null, { page }); 
    await And('the confirmation page displays a delivery ETA', null, { page }); 
  });

  test('Order confirmation page shows order details', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the order confirmation page', null, { page }); 
    await Then('a delivery address card is displayed', null, { page }); 
    await Then('a payment method card is displayed', null, { page }); 
    await And('the list of items ordered with quantities is displayed', null, { page }); 
    await And('the order summary with subtotal, shipping, and total is displayed', null, { page }); 
  });

  test('Continue Shopping button on confirmation page', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, Then, page }) => { 
    await Given('the user is on the order confirmation page', null, { page }); 
    await Then('a "Continue Shopping" button is displayed', null, { page }); 
  });

  test('Order placed triggers confirmation email', { tag: ['@W03', '@W05', '@checkout', '@G13'] }, async ({ Given, Then, page }) => { 
    await Given('an order has been placed', null, { page }); 
    await Then('an order confirmation email is sent to the customer', null, { page }); 
  });

  test('Guest can complete checkout without login', { tag: ['@W03', '@W05', '@checkout'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is not signed in', null, { page }); 
    await And('the user has items in their basket', null, { page }); 
    await When('the user completes the checkout flow', null, { page }); 
    await Then('the order is placed successfully', null, { page }); 
    await And('the order confirmation page is displayed', null, { page }); 
  });

  test('Order confirmation page shows success with order details', { tag: ['@W03', '@W05', '@checkout', '@D10', '@regression'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user has just placed an order', null, { page }); 
    await Then('a green checkmark is displayed', null, { page }); 
    await And('a "Thank you" message is displayed', null, { page }); 
    await And('the confirmation page displays the order number', null, { page }); 
    await And('a delivery ETA is displayed', null, { page }); 
    await And('a delivery address card is displayed', null, { page }); 
    await And('a payment method card is displayed', null, { page }); 
    await And('the list of items ordered with quantities is displayed', null, { page }); 
    await And('the order summary with subtotal, shipping, and total is displayed', null, { page }); 
    await And('a "Continue Shopping" button is displayed', null, { page }); 
  });

  test('Order confirmation page is not a blank 404 page', { tag: ['@W03', '@W05', '@checkout', '@D10', '@regression'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user has just placed an order', null, { page }); 
    await Then('the page does not display a 404 error', null, { page }); 
    await And('the page does not display "Page not found"', null, { page }); 
    await And('the page displays meaningful order content', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\checkout\\checkout.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":23,"tags":["@W03","@W05","@checkout","@D5","@regression"],"steps":[{"pwStepLine":7,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given the user has an empty basket","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the user attempts to access the checkout page","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then the user is redirected away from checkout","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":29,"tags":["@W03","@W05","@checkout","@D5"],"steps":[{"pwStepLine":13,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":14,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When the user navigates to the checkout address step","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then the address form includes fields for first name, last name, address, city, postcode, email, and phone","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":34,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":19,"gherkinStepLine":35,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When the user navigates to the checkout address step","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then a postcode validation gate is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":24,"pickleLine":39,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":25,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given the user enters a postcode of \"E1 6AN\"","stepMatchArguments":[{"group":{"start":30,"value":"\"E1 6AN\"","children":[{"start":31,"value":"E1 6AN","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":26,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the postcode gate passes","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And the user can continue to shop","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":44,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":31,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given the user enters a postcode of \"LS1 1AA\"","stepMatchArguments":[{"group":{"start":30,"value":"\"LS1 1AA\"","children":[{"start":31,"value":"LS1 1AA","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"Then a warning is displayed that delivery may not be available","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":48,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":36,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":50,"keywordType":"Context","textWithKeyword":"And the user is on the checkout address step","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":51,"keywordType":"Action","textWithKeyword":"When the user submits with missing required fields","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":52,"keywordType":"Outcome","textWithKeyword":"Then validation errors are displayed","stepMatchArguments":[]}]},
  {"pwTestLine":42,"pickleLine":55,"tags":["@W03","@W05","@checkout","@D1","@bugfix"],"steps":[{"pwStepLine":43,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":57,"keywordType":"Context","textWithKeyword":"And the user has filled in their delivery address","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":58,"keywordType":"Action","textWithKeyword":"When the user proceeds to the delivery step","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"Then only Saturday and Sunday dates are available for selection","stepMatchArguments":[]}]},
  {"pwTestLine":49,"pickleLine":62,"tags":["@W03","@W05","@checkout","@D1"],"steps":[{"pwStepLine":50,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"And the user has filled in their delivery address","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":65,"keywordType":"Action","textWithKeyword":"When the user proceeds to the delivery step","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then three time windows are available covering morning, afternoon, and evening","stepMatchArguments":[]}]},
  {"pwTestLine":56,"pickleLine":68,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":57,"gherkinStepLine":69,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":70,"keywordType":"Action","textWithKeyword":"When the user navigates to the payment step","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":71,"keywordType":"Outcome","textWithKeyword":"Then a card payment form is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":62,"pickleLine":73,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":63,"gherkinStepLine":74,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":64,"gherkinStepLine":75,"keywordType":"Action","textWithKeyword":"When the user navigates to the payment step","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":76,"keywordType":"Outcome","textWithKeyword":"Then a pay button is displayed with the order total","stepMatchArguments":[]}]},
  {"pwTestLine":68,"pickleLine":78,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":69,"gherkinStepLine":79,"keywordType":"Context","textWithKeyword":"Given the user is on the review step","stepMatchArguments":[]},{"pwStepLine":70,"gherkinStepLine":80,"keywordType":"Outcome","textWithKeyword":"Then the order summary shows the items, shipping cost, and total","stepMatchArguments":[]},{"pwStepLine":71,"gherkinStepLine":81,"keywordType":"Outcome","textWithKeyword":"And the delivery address is displayed","stepMatchArguments":[]},{"pwStepLine":72,"gherkinStepLine":82,"keywordType":"Outcome","textWithKeyword":"And the selected delivery slot is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":75,"pickleLine":84,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":76,"gherkinStepLine":85,"keywordType":"Context","textWithKeyword":"Given the user has just placed an order","stepMatchArguments":[]},{"pwStepLine":77,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"Then the confirmation page displays a green checkmark","stepMatchArguments":[]},{"pwStepLine":78,"gherkinStepLine":87,"keywordType":"Outcome","textWithKeyword":"And the confirmation page displays a \"Thank you\" message","stepMatchArguments":[{"group":{"start":33,"value":"\"Thank you\"","children":[{"start":34,"value":"Thank you","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":79,"gherkinStepLine":88,"keywordType":"Outcome","textWithKeyword":"And the confirmation page displays the order number","stepMatchArguments":[]},{"pwStepLine":80,"gherkinStepLine":89,"keywordType":"Outcome","textWithKeyword":"And the confirmation page displays a delivery ETA","stepMatchArguments":[]}]},
  {"pwTestLine":83,"pickleLine":91,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":84,"gherkinStepLine":92,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":93,"keywordType":"Outcome","textWithKeyword":"Then a delivery address card is displayed","stepMatchArguments":[]},{"pwStepLine":86,"gherkinStepLine":94,"keywordType":"Outcome","textWithKeyword":"Then a payment method card is displayed","stepMatchArguments":[]},{"pwStepLine":87,"gherkinStepLine":95,"keywordType":"Outcome","textWithKeyword":"And the list of items ordered with quantities is displayed","stepMatchArguments":[]},{"pwStepLine":88,"gherkinStepLine":96,"keywordType":"Outcome","textWithKeyword":"And the order summary with subtotal, shipping, and total is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":91,"pickleLine":98,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":92,"gherkinStepLine":99,"keywordType":"Context","textWithKeyword":"Given the user is on the order confirmation page","stepMatchArguments":[]},{"pwStepLine":93,"gherkinStepLine":100,"keywordType":"Outcome","textWithKeyword":"Then a \"Continue Shopping\" button is displayed","stepMatchArguments":[{"group":{"start":2,"value":"\"Continue Shopping\"","children":[{"start":3,"value":"Continue Shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":96,"pickleLine":103,"tags":["@W03","@W05","@checkout","@G13"],"steps":[{"pwStepLine":97,"gherkinStepLine":104,"keywordType":"Context","textWithKeyword":"Given an order has been placed","stepMatchArguments":[]},{"pwStepLine":98,"gherkinStepLine":105,"keywordType":"Outcome","textWithKeyword":"Then an order confirmation email is sent to the customer","stepMatchArguments":[]}]},
  {"pwTestLine":101,"pickleLine":107,"tags":["@W03","@W05","@checkout"],"steps":[{"pwStepLine":102,"gherkinStepLine":108,"keywordType":"Context","textWithKeyword":"Given the user is not signed in","stepMatchArguments":[]},{"pwStepLine":103,"gherkinStepLine":109,"keywordType":"Context","textWithKeyword":"And the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":104,"gherkinStepLine":110,"keywordType":"Action","textWithKeyword":"When the user completes the checkout flow","stepMatchArguments":[]},{"pwStepLine":105,"gherkinStepLine":111,"keywordType":"Outcome","textWithKeyword":"Then the order is placed successfully","stepMatchArguments":[]},{"pwStepLine":106,"gherkinStepLine":112,"keywordType":"Outcome","textWithKeyword":"And the order confirmation page is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":109,"pickleLine":115,"tags":["@W03","@W05","@checkout","@D10","@regression"],"steps":[{"pwStepLine":110,"gherkinStepLine":116,"keywordType":"Context","textWithKeyword":"Given the user has just placed an order","stepMatchArguments":[]},{"pwStepLine":111,"gherkinStepLine":117,"keywordType":"Outcome","textWithKeyword":"Then a green checkmark is displayed","stepMatchArguments":[]},{"pwStepLine":112,"gherkinStepLine":118,"keywordType":"Outcome","textWithKeyword":"And a \"Thank you\" message is displayed","stepMatchArguments":[{"group":{"start":2,"value":"\"Thank you\"","children":[{"start":3,"value":"Thank you","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":113,"gherkinStepLine":119,"keywordType":"Outcome","textWithKeyword":"And the confirmation page displays the order number","stepMatchArguments":[]},{"pwStepLine":114,"gherkinStepLine":120,"keywordType":"Outcome","textWithKeyword":"And a delivery ETA is displayed","stepMatchArguments":[]},{"pwStepLine":115,"gherkinStepLine":121,"keywordType":"Outcome","textWithKeyword":"And a delivery address card is displayed","stepMatchArguments":[]},{"pwStepLine":116,"gherkinStepLine":122,"keywordType":"Outcome","textWithKeyword":"And a payment method card is displayed","stepMatchArguments":[]},{"pwStepLine":117,"gherkinStepLine":123,"keywordType":"Outcome","textWithKeyword":"And the list of items ordered with quantities is displayed","stepMatchArguments":[]},{"pwStepLine":118,"gherkinStepLine":124,"keywordType":"Outcome","textWithKeyword":"And the order summary with subtotal, shipping, and total is displayed","stepMatchArguments":[]},{"pwStepLine":119,"gherkinStepLine":125,"keywordType":"Outcome","textWithKeyword":"And a \"Continue Shopping\" button is displayed","stepMatchArguments":[{"group":{"start":2,"value":"\"Continue Shopping\"","children":[{"start":3,"value":"Continue Shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":122,"pickleLine":128,"tags":["@W03","@W05","@checkout","@D10","@regression"],"steps":[{"pwStepLine":123,"gherkinStepLine":129,"keywordType":"Context","textWithKeyword":"Given the user has just placed an order","stepMatchArguments":[]},{"pwStepLine":124,"gherkinStepLine":130,"keywordType":"Outcome","textWithKeyword":"Then the page does not display a 404 error","stepMatchArguments":[]},{"pwStepLine":125,"gherkinStepLine":131,"keywordType":"Outcome","textWithKeyword":"And the page does not display \"Page not found\"","stepMatchArguments":[{"group":{"start":26,"value":"\"Page not found\"","children":[{"start":27,"value":"Page not found","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":126,"gherkinStepLine":132,"keywordType":"Outcome","textWithKeyword":"And the page displays meaningful order content","stepMatchArguments":[]}]},
]; // bdd-data-end