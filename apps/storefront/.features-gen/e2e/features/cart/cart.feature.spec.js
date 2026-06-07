// Generated from: e2e\features\cart\cart.feature
import { test } from "playwright-bdd";

test.describe('Cart Management', () => {

  test('Add a single-variant product from a category page', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the "corn" category page', null, { page }); 
    await When('the user adds a product to their basket', null, { page }); 
    await Then('the basket contains at least one item', null, { page }); 
  });

  test('Quantity controls replace the Add button after first add', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the "corn" category page', null, { page }); 
    await When('the user adds a product to their basket', null, { page }); 
    await Then('the product card shows quantity controls', null, { page }); 
  });

  test('View basket dropdown after adding a product', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the "corn" category page', null, { page }); 
    await When('the user adds a product to their basket', null, { page }); 
    await When('the user opens the basket dropdown', null, { page }); 
    await Then('the dropdown shows at least one item', null, { page }); 
  });

  test('View an empty basket page', { tag: ['@W02', '@cart'] }, async ({ Given, Then, page }) => { 
    await Given('the user navigates to "/cart"', null, { page }); 
    await Then('the page displays an empty basket message', null, { page }); 
  });

  test('Add a product from the product detail page', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on the product detail page for a single-variant product', null, { page }); 
    await When('the user sets the quantity to 3', null, { page }); 
    await And('the user clicks "Add to Cart"', null, { page }); 
    await Then('the basket shows 3 units of the product', null, { page }); 
  });

  test('Update quantity on the cart page', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has items in their basket', null, { page }); 
    await When('the user changes the quantity of an item from 1 to 3', null, { page }); 
    await Then('the subtotal updates to reflect 3 times the unit price', null, { page }); 
  });

  test('Remove an item from the cart', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has an item in their basket with quantity 1', null, { page }); 
    await When('the user reduces the quantity to zero', null, { page }); 
    await Then('the item is removed from the basket', null, { page }); 
  });

  test('Cart page groups items by product category', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has items from different categories in their basket', null, { page }); 
    await When('the user views the cart page', null, { page }); 
    await Then('items are grouped under their respective category headings', null, { page }); 
  });

  test('Cart page shows order summary', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has items in their basket', null, { page }); 
    await When('the user views the cart page', null, { page }); 
    await Then('the order summary displays the subtotal', null, { page }); 
    await And('the order summary displays the shipping cost', null, { page }); 
    await And('the order summary displays the total', null, { page }); 
  });

  test('Cart page shows a promo code input', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has items in their basket', null, { page }); 
    await When('the user views the cart page', null, { page }); 
    await Then('a promo code input field is visible', null, { page }); 
  });

  test('Apply a valid promo code', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has items in their basket', null, { page }); 
    await When('the user enters a valid promo code and clicks apply', null, { page }); 
    await Then('the discount is reflected in the order summary', null, { page }); 
  });

  test('Remove an applied promo code', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('a promo code has been applied to the basket', null, { page }); 
    await When('the user clicks remove on the applied promotion', null, { page }); 
    await Then('the discount is removed from the order summary', null, { page }); 
  });

  test('Out-of-stock items are flagged in the cart', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has a mix of in-stock and out-of-stock items in their basket', null, { page }); 
    await When('the user views the cart page', null, { page }); 
    await Then('out-of-stock items are visually flagged with a red alert badge', null, { page }); 
    await And('out-of-stock items are displayed at the top of the list', null, { page }); 
  });

  test('Cart dropdown shows subtotal', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has items in their basket', null, { page }); 
    await When('the user opens the basket dropdown', null, { page }); 
    await Then('the dropdown displays the basket subtotal', null, { page }); 
  });

  test('Cart dropdown has navigation buttons', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has items in their basket', null, { page }); 
    await When('the user opens the basket dropdown', null, { page }); 
    await Then('the dropdown shows a "View Cart" button', null, { page }); 
    await And('the dropdown shows a "Go to Checkout" button', null, { page }); 
  });

  test('Basket items persist across page navigation', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has added items to their basket', null, { page }); 
    await When('the user navigates to a different page', null, { page }); 
    await And('the user returns to the cart page', null, { page }); 
    await Then('the basket still contains the same items', null, { page }); 
  });

  test('Guest with items sees a sign-in prompt', { tag: ['@W02', '@cart'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is not signed in', null, { page }); 
    await And('the user has items in their basket', null, { page }); 
    await When('the user views the cart page', null, { page }); 
    await Then('the page displays a prompt to sign in for a better experience', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\cart\\cart.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":19,"tags":["@W02","@cart"],"steps":[{"pwStepLine":7,"gherkinStepLine":20,"keywordType":"Context","textWithKeyword":"Given the user is on the \"corn\" category page","stepMatchArguments":[{"group":{"start":19,"value":"\"corn\"","children":[{"start":20,"value":"corn","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":21,"keywordType":"Action","textWithKeyword":"When the user adds a product to their basket","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then the basket contains at least one item","stepMatchArguments":[]}]},
  {"pwTestLine":12,"pickleLine":24,"tags":["@W02","@cart"],"steps":[{"pwStepLine":13,"gherkinStepLine":25,"keywordType":"Context","textWithKeyword":"Given the user is on the \"corn\" category page","stepMatchArguments":[{"group":{"start":19,"value":"\"corn\"","children":[{"start":20,"value":"corn","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the user adds a product to their basket","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the product card shows quantity controls","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":29,"tags":["@W02","@cart"],"steps":[{"pwStepLine":19,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given the user is on the \"corn\" category page","stepMatchArguments":[{"group":{"start":19,"value":"\"corn\"","children":[{"start":20,"value":"corn","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When the user adds a product to their basket","stepMatchArguments":[]},{"pwStepLine":21,"gherkinStepLine":32,"keywordType":"Action","textWithKeyword":"When the user opens the basket dropdown","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"Then the dropdown shows at least one item","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":35,"tags":["@W02","@cart"],"steps":[{"pwStepLine":26,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/cart\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/cart\"","children":[{"start":23,"value":"/cart","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":27,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then the page displays an empty basket message","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":39,"tags":["@W02","@cart"],"steps":[{"pwStepLine":31,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given the user is on the product detail page for a single-variant product","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When the user sets the quantity to 3","stepMatchArguments":[{"group":{"start":30,"value":"3"},"parameterTypeName":"int"}]},{"pwStepLine":33,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"And the user clicks \"Add to Cart\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Add to Cart\"","children":[{"start":17,"value":"Add to Cart","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":34,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"Then the basket shows 3 units of the product","stepMatchArguments":[{"group":{"start":17,"value":"3"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":37,"pickleLine":45,"tags":["@W02","@cart"],"steps":[{"pwStepLine":38,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When the user changes the quantity of an item from 1 to 3","stepMatchArguments":[{"group":{"start":46,"value":"1"},"parameterTypeName":"int"},{"group":{"start":51,"value":"3"},"parameterTypeName":"int"}]},{"pwStepLine":40,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"Then the subtotal updates to reflect 3 times the unit price","stepMatchArguments":[{"group":{"start":32,"value":"3"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":43,"pickleLine":50,"tags":["@W02","@cart"],"steps":[{"pwStepLine":44,"gherkinStepLine":51,"keywordType":"Context","textWithKeyword":"Given the user has an item in their basket with quantity 1","stepMatchArguments":[{"group":{"start":51,"value":"1"},"parameterTypeName":"int"}]},{"pwStepLine":45,"gherkinStepLine":52,"keywordType":"Action","textWithKeyword":"When the user reduces the quantity to zero","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then the item is removed from the basket","stepMatchArguments":[]}]},
  {"pwTestLine":49,"pickleLine":55,"tags":["@W02","@cart"],"steps":[{"pwStepLine":50,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"Given the user has items from different categories in their basket","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When the user views the cart page","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then items are grouped under their respective category headings","stepMatchArguments":[]}]},
  {"pwTestLine":55,"pickleLine":60,"tags":["@W02","@cart"],"steps":[{"pwStepLine":56,"gherkinStepLine":61,"keywordType":"Context","textWithKeyword":"Given the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":62,"keywordType":"Action","textWithKeyword":"When the user views the cart page","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"Then the order summary displays the subtotal","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":64,"keywordType":"Outcome","textWithKeyword":"And the order summary displays the shipping cost","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":65,"keywordType":"Outcome","textWithKeyword":"And the order summary displays the total","stepMatchArguments":[]}]},
  {"pwTestLine":63,"pickleLine":67,"tags":["@W02","@cart"],"steps":[{"pwStepLine":64,"gherkinStepLine":68,"keywordType":"Context","textWithKeyword":"Given the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":69,"keywordType":"Action","textWithKeyword":"When the user views the cart page","stepMatchArguments":[]},{"pwStepLine":66,"gherkinStepLine":70,"keywordType":"Outcome","textWithKeyword":"Then a promo code input field is visible","stepMatchArguments":[]}]},
  {"pwTestLine":69,"pickleLine":72,"tags":["@W02","@cart"],"steps":[{"pwStepLine":70,"gherkinStepLine":73,"keywordType":"Context","textWithKeyword":"Given the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":71,"gherkinStepLine":74,"keywordType":"Action","textWithKeyword":"When the user enters a valid promo code and clicks apply","stepMatchArguments":[]},{"pwStepLine":72,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"Then the discount is reflected in the order summary","stepMatchArguments":[]}]},
  {"pwTestLine":75,"pickleLine":77,"tags":["@W02","@cart"],"steps":[{"pwStepLine":76,"gherkinStepLine":78,"keywordType":"Context","textWithKeyword":"Given a promo code has been applied to the basket","stepMatchArguments":[]},{"pwStepLine":77,"gherkinStepLine":79,"keywordType":"Action","textWithKeyword":"When the user clicks remove on the applied promotion","stepMatchArguments":[]},{"pwStepLine":78,"gherkinStepLine":80,"keywordType":"Outcome","textWithKeyword":"Then the discount is removed from the order summary","stepMatchArguments":[]}]},
  {"pwTestLine":81,"pickleLine":82,"tags":["@W02","@cart"],"steps":[{"pwStepLine":82,"gherkinStepLine":83,"keywordType":"Context","textWithKeyword":"Given the user has a mix of in-stock and out-of-stock items in their basket","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":84,"keywordType":"Action","textWithKeyword":"When the user views the cart page","stepMatchArguments":[]},{"pwStepLine":84,"gherkinStepLine":85,"keywordType":"Outcome","textWithKeyword":"Then out-of-stock items are visually flagged with a red alert badge","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"And out-of-stock items are displayed at the top of the list","stepMatchArguments":[]}]},
  {"pwTestLine":88,"pickleLine":88,"tags":["@W02","@cart"],"steps":[{"pwStepLine":89,"gherkinStepLine":89,"keywordType":"Context","textWithKeyword":"Given the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":90,"gherkinStepLine":90,"keywordType":"Action","textWithKeyword":"When the user opens the basket dropdown","stepMatchArguments":[]},{"pwStepLine":91,"gherkinStepLine":91,"keywordType":"Outcome","textWithKeyword":"Then the dropdown displays the basket subtotal","stepMatchArguments":[]}]},
  {"pwTestLine":94,"pickleLine":93,"tags":["@W02","@cart"],"steps":[{"pwStepLine":95,"gherkinStepLine":94,"keywordType":"Context","textWithKeyword":"Given the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":96,"gherkinStepLine":95,"keywordType":"Action","textWithKeyword":"When the user opens the basket dropdown","stepMatchArguments":[]},{"pwStepLine":97,"gherkinStepLine":96,"keywordType":"Outcome","textWithKeyword":"Then the dropdown shows a \"View Cart\" button","stepMatchArguments":[{"group":{"start":21,"value":"\"View Cart\"","children":[{"start":22,"value":"View Cart","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":98,"gherkinStepLine":97,"keywordType":"Outcome","textWithKeyword":"And the dropdown shows a \"Go to Checkout\" button","stepMatchArguments":[{"group":{"start":21,"value":"\"Go to Checkout\"","children":[{"start":22,"value":"Go to Checkout","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":101,"pickleLine":99,"tags":["@W02","@cart"],"steps":[{"pwStepLine":102,"gherkinStepLine":100,"keywordType":"Context","textWithKeyword":"Given the user has added items to their basket","stepMatchArguments":[]},{"pwStepLine":103,"gherkinStepLine":101,"keywordType":"Action","textWithKeyword":"When the user navigates to a different page","stepMatchArguments":[]},{"pwStepLine":104,"gherkinStepLine":102,"keywordType":"Action","textWithKeyword":"And the user returns to the cart page","stepMatchArguments":[]},{"pwStepLine":105,"gherkinStepLine":103,"keywordType":"Outcome","textWithKeyword":"Then the basket still contains the same items","stepMatchArguments":[]}]},
  {"pwTestLine":108,"pickleLine":105,"tags":["@W02","@cart"],"steps":[{"pwStepLine":109,"gherkinStepLine":106,"keywordType":"Context","textWithKeyword":"Given the user is not signed in","stepMatchArguments":[]},{"pwStepLine":110,"gherkinStepLine":107,"keywordType":"Context","textWithKeyword":"And the user has items in their basket","stepMatchArguments":[]},{"pwStepLine":111,"gherkinStepLine":108,"keywordType":"Action","textWithKeyword":"When the user views the cart page","stepMatchArguments":[]},{"pwStepLine":112,"gherkinStepLine":109,"keywordType":"Outcome","textWithKeyword":"Then the page displays a prompt to sign in for a better experience","stepMatchArguments":[]}]},
]; // bdd-data-end