// Generated from: e2e\features\wishlist\wishlist.feature
import { test } from "playwright-bdd";

test.describe('Wishlist', () => {

  test('Add a product to the wishlist from a product card', { tag: ['@W06', '@wishlist'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a category page', null, { page }); 
    await When('the user clicks the heart icon on a product card', null, { page }); 
    await Then('the heart icon fills with the brand orange colour', null, { page }); 
    await And('the product is saved to the wishlist', null, { page }); 
  });

  test('Remove a product from the wishlist', { tag: ['@W06', '@wishlist'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a category page with a product already in the wishlist', null, { page }); 
    await When('the user clicks the filled heart icon', null, { page }); 
    await Then('the heart icon returns to an outline state', null, { page }); 
    await And('the product is removed from the wishlist', null, { page }); 
  });

  test('View the wishlist page with items', { tag: ['@W06', '@wishlist'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has at least one product in their wishlist', null, { page }); 
    await When('the user navigates to "/wishlist"', null, { page }); 
    await Then('the page displays the wishlisted products in a grid', null, { page }); 
    await And('each product shows a thumbnail, title, and price', null, { page }); 
  });

  test('View an empty wishlist page', { tag: ['@W06', '@wishlist'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has an empty wishlist', null, { page }); 
    await When('the user navigates to "/wishlist"', null, { page }); 
    await Then('the page displays a heart icon', null, { page }); 
    await And('the page displays the message "Your wishlist is empty"', null, { page }); 
    await And('the page displays a "Start Shopping" call-to-action', null, { page }); 
  });

  test('Wishlist buttons are present on the store page', { tag: ['@W06', '@wishlist'] }, async ({ Given, Then, page }) => { 
    await Given('the user is on the store page', null, { page }); 
    await Then('each product card displays a heart icon for the wishlist', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\wishlist\\wishlist.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":12,"tags":["@W06","@wishlist"],"steps":[{"pwStepLine":7,"gherkinStepLine":13,"keywordType":"Context","textWithKeyword":"Given the user is on a category page","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"When the user clicks the heart icon on a product card","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the heart icon fills with the brand orange colour","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"And the product is saved to the wishlist","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":18,"tags":["@W06","@wishlist"],"steps":[{"pwStepLine":14,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given the user is on a category page with a product already in the wishlist","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When the user clicks the filled heart icon","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then the heart icon returns to an outline state","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"And the product is removed from the wishlist","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":24,"tags":["@W06","@wishlist"],"steps":[{"pwStepLine":21,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given the user has at least one product in their wishlist","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/wishlist\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/wishlist\"","children":[{"start":23,"value":"/wishlist","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the page displays the wishlisted products in a grid","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And each product shows a thumbnail, title, and price","stepMatchArguments":[]}]},
  {"pwTestLine":27,"pickleLine":30,"tags":["@W06","@wishlist"],"steps":[{"pwStepLine":28,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given the user has an empty wishlist","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/wishlist\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/wishlist\"","children":[{"start":23,"value":"/wishlist","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then the page displays a heart icon","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"And the page displays the message \"Your wishlist is empty\"","stepMatchArguments":[{"group":{"start":30,"value":"\"Your wishlist is empty\"","children":[{"start":31,"value":"Your wishlist is empty","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"And the page displays a \"Start Shopping\" call-to-action","stepMatchArguments":[{"group":{"start":20,"value":"\"Start Shopping\"","children":[{"start":21,"value":"Start Shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":35,"pickleLine":37,"tags":["@W06","@wishlist"],"steps":[{"pwStepLine":36,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given the user is on the store page","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"Then each product card displays a heart icon for the wishlist","stepMatchArguments":[]}]},
]; // bdd-data-end