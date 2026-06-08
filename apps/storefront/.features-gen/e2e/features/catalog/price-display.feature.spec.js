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
]; // bdd-data-end