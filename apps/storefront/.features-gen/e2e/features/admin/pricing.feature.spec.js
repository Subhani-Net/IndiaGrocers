// Generated from: e2e\features\admin\pricing.feature
import { test } from "playwright-bdd";

test.describe('Admin Price Management', () => {

  test('Dry-run a pricelist against the product database', { tag: ['@W07', '@admin', '@pricing'] }, async ({ Given, Then, And, page }) => { 
    await Given('the admin runs the pricelist loader in dry-run mode', null, { page }); 
    await Then('all 506 products are fetched from the database', null, { page }); 
    await And('the pricelist entries are matched to products by title', null, { page }); 
    await And('a report is generated showing which products would be updated', null, { page }); 
    await And('no prices are actually changed', null, { page }); 
  });

  test('Apply a pricelist to update product prices', { tag: ['@W07', '@admin', '@pricing'] }, async ({ Given, Then, And, page }) => { 
    await Given('the admin runs the pricelist loader in apply mode', null, { page }); 
    await Then('matched product prices are updated to the pricelist values', null, { page }); 
    await And('a summary is shown with counts of updated, skipped, and not-found products', null, { page }); 
  });

  test('Products not in the pricelist are unaffected', { tag: ['@W07', '@admin', '@pricing'] }, async ({ Given, Then, page }) => { 
    await Given('the admin applies a pricelist to specific products', null, { page }); 
    await Then('products not listed in the pricelist retain their current prices', null, { page }); 
  });

  test('Verify an updated price on the storefront', { tag: ['@W07', '@admin', '@pricing'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the admin has updated a product price via the pricelist', null, { page }); 
    await And('the search index has been reindexed', null, { page }); 
    await When('the user views the product detail page', null, { page }); 
    await Then('the displayed price matches the updated pricelist value', null, { page }); 
  });

  test('Price is displayed correctly in pounds on the storefront', { tag: ['@W07', '@admin', '@pricing'] }, async ({ Given, When, Then, page }) => { 
    await Given('a product has a price of 199 pence in the database', null, { page }); 
    await When('the user views the product', null, { page }); 
    await Then('the displayed price is "£1.99"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\admin\\pricing.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":15,"tags":["@W07","@admin","@pricing"],"steps":[{"pwStepLine":7,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given the admin runs the pricelist loader in dry-run mode","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then all 506 products are fetched from the database","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the pricelist entries are matched to products by title","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And a report is generated showing which products would be updated","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And no prices are actually changed","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":22,"tags":["@W07","@admin","@pricing"],"steps":[{"pwStepLine":15,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given the admin runs the pricelist loader in apply mode","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then matched product prices are updated to the pricelist values","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And a summary is shown with counts of updated, skipped, and not-found products","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":27,"tags":["@W07","@admin","@pricing"],"steps":[{"pwStepLine":21,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"Given the admin applies a pricelist to specific products","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then products not listed in the pricelist retain their current prices","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":31,"tags":["@W07","@admin","@pricing"],"steps":[{"pwStepLine":26,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"Given the admin has updated a product price via the pricelist","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"And the search index has been reindexed","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When the user views the product detail page","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the displayed price matches the updated pricelist value","stepMatchArguments":[]}]},
  {"pwTestLine":32,"pickleLine":37,"tags":["@W07","@admin","@pricing"],"steps":[{"pwStepLine":33,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given a product has a price of 199 pence in the database","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When the user views the product","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then the displayed price is \"£1.99\"","stepMatchArguments":[{"group":{"start":23,"value":"\"£1.99\"","children":[{"start":24,"value":"£1.99","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end