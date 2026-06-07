// Generated from: e2e\features\errors\error-handling.feature
import { test } from "playwright-bdd";

test.describe('Error Handling and Edge Cases', () => {

  test('Navigate to a non-existent page', { tag: ['@errors', '@resilience'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to "/non-existent-page"', null, { page }); 
    await Then('the page displays a 404 error message', null, { page }); 
    await And('the page displays a link to return to the homepage', null, { page }); 
  });

  test('Navigate to a non-existent product', { tag: ['@errors', '@resilience'] }, async ({ Given, Then, page }) => { 
    await Given('the user navigates to "/products/non-existent-handle"', null, { page }); 
    await Then('the page displays a 404 error message', null, { page }); 
  });

  test('Navigate to a non-existent category', { tag: ['@errors', '@resilience'] }, async ({ Given, Then, page }) => { 
    await Given('the user navigates to "/categories/non-existent-category"', null, { page }); 
    await Then('the page displays a 404 or empty state message', null, { page }); 
  });

  test('Product image fails to load', { tag: ['@errors', '@resilience'] }, async ({ Given, When, Then, page }) => { 
    await Given('a product has a broken image URL', null, { page }); 
    await When('the user views the product on a listing page', null, { page }); 
    await Then('a placeholder image is displayed instead of a broken image icon', null, { page }); 
  });

  test('Cart persists across page navigation', { tag: ['@errors', '@resilience'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has added items to their basket', null, { page }); 
    await When('the user navigates to a different page', null, { page }); 
    await And('the user returns to the category page', null, { page }); 
    await Then('the basket still contains the same items', null, { page }); 
  });

  test('Cart persists across browser refresh', { tag: ['@errors', '@resilience'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has added items to their basket', null, { page }); 
    await When('the user refreshes the browser', null, { page }); 
    await Then('the basket still contains the same items', null, { page }); 
  });

  test('Backend unreachable shows a sensible error', { tag: ['@errors', '@resilience'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the backend is not responding', null, { page }); 
    await When('the user navigates to any store page', null, { page }); 
    await Then('a sensible error message is displayed', null, { page }); 
    await And('no blank page or raw error is shown', null, { page }); 
  });

  test('No console errors on any page', { tag: ['@errors', '@resilience'] }, async ({ Given, Then, page }) => { 
    await Given('the user navigates to any page', null, { page }); 
    await Then('no errors are logged to the browser console', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\errors\\error-handling.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":13,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":7,"gherkinStepLine":14,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/non-existent-page\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/non-existent-page\"","children":[{"start":23,"value":"/non-existent-page","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the page displays a 404 error message","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And the page displays a link to return to the homepage","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":18,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":13,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/products/non-existent-handle\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/products/non-existent-handle\"","children":[{"start":23,"value":"/products/non-existent-handle","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the page displays a 404 error message","stepMatchArguments":[]}]},
  {"pwTestLine":17,"pickleLine":22,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":18,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/categories/non-existent-category\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/categories/non-existent-category\"","children":[{"start":23,"value":"/categories/non-existent-category","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then the page displays a 404 or empty state message","stepMatchArguments":[{"group":{"start":20,"value":"404"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":22,"pickleLine":26,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":23,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given a product has a broken image URL","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When the user views the product on a listing page","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then a placeholder image is displayed instead of a broken image icon","stepMatchArguments":[]}]},
  {"pwTestLine":28,"pickleLine":31,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":29,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"Given the user has added items to their basket","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When the user navigates to a different page","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"And the user returns to the category page","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the basket still contains the same items","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":37,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":36,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given the user has added items to their basket","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":39,"keywordType":"Action","textWithKeyword":"When the user refreshes the browser","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":40,"keywordType":"Outcome","textWithKeyword":"Then the basket still contains the same items","stepMatchArguments":[]}]},
  {"pwTestLine":41,"pickleLine":42,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":42,"gherkinStepLine":43,"keywordType":"Context","textWithKeyword":"Given the backend is not responding","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":44,"keywordType":"Action","textWithKeyword":"When the user navigates to any store page","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"Then a sensible error message is displayed","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"And no blank page or raw error is shown","stepMatchArguments":[]}]},
  {"pwTestLine":48,"pickleLine":48,"tags":["@errors","@resilience"],"steps":[{"pwStepLine":49,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given the user navigates to any page","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":50,"keywordType":"Outcome","textWithKeyword":"Then no errors are logged to the browser console","stepMatchArguments":[]}]},
]; // bdd-data-end