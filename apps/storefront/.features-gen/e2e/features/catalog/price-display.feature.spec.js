// Generated from: e2e\features\catalog\price-display.feature
import { test } from "playwright-bdd";

test.describe('Price Display Consistency', () => {

  test('Product card price is displayed correctly', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the "spices-herbs" category page', null, { page }); 
    await Then('every product card displays a price in GBP pounds and pence', null, { page }); 
    await And('no price exceeds £100 for a single grocery item', null, { page }); 
  });

  test('Product detail page shows the correct price', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the product detail page for "Natco - Cumin Seeds 400g"', null, { page }); 
    await Then('the page displays a price of "£3.49"', null, { page }); 
    await And('the price is formatted as GBP with two decimal places after a pound sign', null, { page }); 
  });

  test('Cart order summary shows correct prices', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has added a product to the basket', null, { page }); 
    await When('the user views the cart page', null, { page }); 
    await Then('the subtotal is displayed in GBP pounds and pence', null, { page }); 
    await And('the total is displayed in GBP pounds and pence', null, { page }); 
  });

  test('Free delivery threshold displays correctly', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, Then, page }) => { 
    await Given('the user views the basket progress bar', null, { page }); 
    await Then('the free delivery threshold contains a pound sign and two decimal places', null, { page }); 
  });

  test('Minimum order amount displays correctly', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has items below the minimum order threshold', null, { page }); 
    await When('the user views the basket', null, { page }); 
    await Then('the minimum order amount contains a pound sign and two decimal places', null, { page }); 
  });

  test('Price below £1 is displayed in pence', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, When, Then, page }) => { 
    await Given('a product has a sub-pound price', null, { page }); 
    await When('the user views the product', null, { page }); 
    await Then('the displayed price contains a pence value', null, { page }); 
  });

  test('Payment amount matches the displayed cart total', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user has an item in their basket', null, { page }); 
    await And('the user is on the payment step', null, { page }); 
    await Then('the pay button displays the cart total in GBP', null, { page }); 
    await And('the amount charged to the payment gateway equals the displayed total'); 
  });

  test('Backend stores prices in pence, payment gateway receives pence', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('a product has a price of 199 pence in the database', null, { page }); 
    await When('the user adds the product and proceeds to payment'); 
    await Then('the payment gateway receives an amount of 199 pence', null, { page }); 
    await And('the user\'s card is charged 199 pence', null, { page }); 
  });

  test('No price discrepancy between frontend, backend, and payment', { tag: ['@W01', '@W02', '@W03', '@W05', '@pricing'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user completes a checkout flow'); 
    await Then('the displayed price on the storefront matches the price in the database divided by 100', null, { page }); 
    await And('the amount charged by the payment gateway matches the displayed price multiplied by 100', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\catalog\\price-display.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":33,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":7,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given the user is on the \"spices-herbs\" category page","stepMatchArguments":[{"group":{"start":19,"value":"\"spices-herbs\"","children":[{"start":20,"value":"spices-herbs","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then every product card displays a price in GBP pounds and pence","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And no price exceeds £100 for a single grocery item","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":38,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":13,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given the user navigates to the product detail page for \"Natco - Cumin Seeds 400g\"","stepMatchArguments":[{"group":{"start":50,"value":"\"Natco - Cumin Seeds 400g\"","children":[{"start":51,"value":"Natco - Cumin Seeds 400g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then the page displays a price of \"£3.49\"","stepMatchArguments":[{"group":{"start":29,"value":"\"£3.49\"","children":[{"start":30,"value":"£3.49","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"And the price is formatted as GBP with two decimal places after a pound sign","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":43,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":19,"gherkinStepLine":44,"keywordType":"Context","textWithKeyword":"Given the user has added a product to the basket","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":45,"keywordType":"Action","textWithKeyword":"When the user views the cart page","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"Then the subtotal is displayed in GBP pounds and pence","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"And the total is displayed in GBP pounds and pence","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":49,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":26,"gherkinStepLine":50,"keywordType":"Context","textWithKeyword":"Given the user views the basket progress bar","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then the free delivery threshold contains a pound sign and two decimal places","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":53,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":31,"gherkinStepLine":54,"keywordType":"Context","textWithKeyword":"Given the user has items below the minimum order threshold","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":55,"keywordType":"Action","textWithKeyword":"When the user views the basket","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":56,"keywordType":"Outcome","textWithKeyword":"Then the minimum order amount contains a pound sign and two decimal places","stepMatchArguments":[]}]},
  {"pwTestLine":36,"pickleLine":58,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":37,"gherkinStepLine":59,"keywordType":"Context","textWithKeyword":"Given a product has a sub-pound price","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":60,"keywordType":"Action","textWithKeyword":"When the user views the product","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":61,"keywordType":"Outcome","textWithKeyword":"Then the displayed price contains a pence value","stepMatchArguments":[]}]},
  {"pwTestLine":42,"pickleLine":63,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":43,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":65,"keywordType":"Context","textWithKeyword":"And the user is on the payment step","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then the pay button displays the cart total in GBP","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":67,"keywordType":"Outcome","textWithKeyword":"And the amount charged to the payment gateway equals the displayed total","stepMatchArguments":[]}]},
  {"pwTestLine":49,"pickleLine":69,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":50,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"Given a product has a price of 199 pence in the database","stepMatchArguments":[{"group":{"start":25,"value":"199"},"parameterTypeName":"int"}]},{"pwStepLine":51,"gherkinStepLine":71,"keywordType":"Action","textWithKeyword":"When the user adds the product and proceeds to payment","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"Then the payment gateway receives an amount of 199 pence","stepMatchArguments":[{"group":{"start":42,"value":"199"},"parameterTypeName":"int"}]},{"pwStepLine":53,"gherkinStepLine":73,"keywordType":"Outcome","textWithKeyword":"And the user's card is charged 199 pence","stepMatchArguments":[{"group":{"start":27,"value":"199"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":56,"pickleLine":75,"tags":["@W01","@W02","@W03","@W05","@pricing"],"steps":[{"pwStepLine":57,"gherkinStepLine":76,"keywordType":"Context","textWithKeyword":"Given the user completes a checkout flow","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":77,"keywordType":"Outcome","textWithKeyword":"Then the displayed price on the storefront matches the price in the database divided by 100","stepMatchArguments":[{"group":{"start":83,"value":"100"},"parameterTypeName":"int"}]},{"pwStepLine":59,"gherkinStepLine":78,"keywordType":"Outcome","textWithKeyword":"And the amount charged by the payment gateway matches the displayed price multiplied by 100","stepMatchArguments":[{"group":{"start":84,"value":"100"},"parameterTypeName":"int"}]}]},
]; // bdd-data-end