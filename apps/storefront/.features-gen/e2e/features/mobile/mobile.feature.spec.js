// Generated from: e2e\features\mobile\mobile.feature
import { test } from "playwright-bdd";

test.describe('Mobile Experience', () => {

  test('Open the mobile hamburger menu', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a mobile device', null, { page }); 
    await When('the user taps the hamburger icon', null, { page }); 
    await Then('the side menu slides in', null, { page }); 
    await And('the menu shows Home, Store, Account, and Cart links', null, { page }); 
    await And('the menu shows all category links', null, { page }); 
  });

  test('Close the mobile side menu via close button', { tag: ['@mobile'] }, async ({ Given, When, Then, page }) => { 
    await Given('the mobile side menu is open', null, { page }); 
    await When('the user taps the close button', null, { page }); 
    await Then('the side menu slides out and closes', null, { page }); 
  });

  test('Close the mobile side menu by tapping outside', { tag: ['@mobile'] }, async ({ Given, When, Then, page }) => { 
    await Given('the mobile side menu is open', null, { page }); 
    await When('the user taps outside the menu', null, { page }); 
    await Then('the side menu slides out and closes', null, { page }); 
  });

  test('Mobile product cards display in horizontal layout', { tag: ['@mobile'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a mobile device', null, { page }); 
    await When('the user views a category page', null, { page }); 
    await Then('product cards are displayed in a horizontal layout', null, { page }); 
    await And('each card shows the product image on the left and text on the right', null, { page }); 
  });

  test('Sticky add-to-cart bar appears on PDP scroll', { tag: ['@mobile'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on a mobile device viewing a product detail page', null, { page }); 
    await When('the user scrolls past the "Add to Cart" button', null, { page }); 
    await Then('a sticky add-to-cart bar appears at the bottom of the screen', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\mobile\\mobile.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":12,"tags":["@mobile"],"steps":[{"pwStepLine":7,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given the user is on a mobile device","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When the user taps the hamburger icon","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the side menu slides in","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And the menu shows Home, Store, Account, and Cart links","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And the menu shows all category links","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":19,"tags":["@mobile"],"steps":[{"pwStepLine":15,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given the mobile side menu is open","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When the user taps the close button","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then the side menu slides out and closes","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":24,"tags":["@mobile"],"steps":[{"pwStepLine":21,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given the mobile side menu is open","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the user taps outside the menu","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the side menu slides out and closes","stepMatchArguments":[]}]},
  {"pwTestLine":26,"pickleLine":29,"tags":["@mobile"],"steps":[{"pwStepLine":27,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given the user is on a mobile device","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When the user views a category page","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then product cards are displayed in a horizontal layout","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"And each card shows the product image on the left and text on the right","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":35,"tags":["@mobile"],"steps":[{"pwStepLine":34,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given the user is on a mobile device viewing a product detail page","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":37,"keywordType":"Action","textWithKeyword":"When the user scrolls past the \"Add to Cart\" button","stepMatchArguments":[{"group":{"start":26,"value":"\"Add to Cart\"","children":[{"start":27,"value":"Add to Cart","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":36,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"Then a sticky add-to-cart bar appears at the bottom of the screen","stepMatchArguments":[]}]},
]; // bdd-data-end