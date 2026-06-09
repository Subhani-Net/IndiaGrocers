// Generated from: e2e\features\checkout\refunds.feature
import { test } from "playwright-bdd";

test.describe('Payment Refunds', () => {

  test('Full refund of a completed order', { tag: ['@W03', '@payment', '@refund'] }, async ({ Given, When, Then, And }) => { 
    await Given('an order has been placed and payment captured'); 
    await When('the admin initiates a full refund'); 
    await Then('the full order amount is refunded to the customer\'s card'); 
    await And('the refund appears in the Stripe dashboard'); 
    await And('a refund confirmation email is sent to the customer'); 
  });

  test('Partial refund of a multi-item order', { tag: ['@W03', '@payment', '@refund'] }, async ({ Given, When, Then, And }) => { 
    await Given('an order has been placed with multiple items'); 
    await When('the admin initiates a refund for a single item'); 
    await Then('only the refunded item\'s amount is returned to the customer'); 
    await And('the remaining items are still charged'); 
  });

  test('Refund amount cannot exceed the original charge', { tag: ['@W03', '@payment', '@refund'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('an order has been placed for "£30.00"', null, { page }); 
    await When('the admin attempts to refund "£35.00"', null, { page }); 
    await Then('the refund is rejected'); 
    await And('an error message is displayed', null, { page }); 
  });

  test('Refund is idempotent', { tag: ['@W03', '@payment', '@refund'] }, async ({ Given, When, Then, And }) => { 
    await Given('an order has already been refunded'); 
    await When('the admin attempts to refund the same order again'); 
    await Then('the charge-already-refunded status is returned'); 
    await And('no duplicate refund is created'); 
  });

  test('Refund notification email is sent', { tag: ['@W03', '@payment', '@refund'] }, async ({ Given, Then, And }) => { 
    await Given('a refund has been processed'); 
    await Then('a refund confirmation email is sent to the customer'); 
    await And('the email includes the refunded amount and order number'); 
  });

  test('Refund provider correctly handles GBP amounts', { tag: ['@W03', '@payment', '@refund'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('a payment was captured for "349 pence"', null, { page }); 
    await When('a refund is initiated for "349 pence"', null, { page }); 
    await Then('the Stripe refund API receives "349" as the amount', null, { page }); 
    await And('the customer\'s card is credited "£3.49"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\checkout\\refunds.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":14,"tags":["@W03","@payment","@refund"],"steps":[{"pwStepLine":7,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given an order has been placed and payment captured","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When the admin initiates a full refund","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then the full order amount is refunded to the customer's card","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the refund appears in the Stripe dashboard","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And a refund confirmation email is sent to the customer","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":21,"tags":["@W03","@payment","@refund"],"steps":[{"pwStepLine":15,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given an order has been placed with multiple items","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When the admin initiates a refund for a single item","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then only the refunded item's amount is returned to the customer","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And the remaining items are still charged","stepMatchArguments":[]}]},
  {"pwTestLine":21,"pickleLine":27,"tags":["@W03","@payment","@refund"],"steps":[{"pwStepLine":22,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"Given an order has been placed for \"£30.00\"","stepMatchArguments":[{"group":{"start":29,"value":"\"£30.00\"","children":[{"start":30,"value":"£30.00","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"When the admin attempts to refund \"£35.00\"","stepMatchArguments":[{"group":{"start":29,"value":"\"£35.00\"","children":[{"start":30,"value":"£35.00","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then the refund is rejected","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And an error message is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":28,"pickleLine":33,"tags":["@W03","@payment","@refund"],"steps":[{"pwStepLine":29,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given an order has already been refunded","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":35,"keywordType":"Action","textWithKeyword":"When the admin attempts to refund the same order again","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"Then the charge-already-refunded status is returned","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"And no duplicate refund is created","stepMatchArguments":[]}]},
  {"pwTestLine":35,"pickleLine":39,"tags":["@W03","@payment","@refund"],"steps":[{"pwStepLine":36,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given a refund has been processed","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then a refund confirmation email is sent to the customer","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And the email includes the refunded amount and order number","stepMatchArguments":[]}]},
  {"pwTestLine":41,"pickleLine":44,"tags":["@W03","@payment","@refund"],"steps":[{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given a payment was captured for \"349 pence\"","stepMatchArguments":[{"group":{"start":27,"value":"\"349 pence\"","children":[{"start":28,"value":"349 pence","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":43,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When a refund is initiated for \"349 pence\"","stepMatchArguments":[{"group":{"start":26,"value":"\"349 pence\"","children":[{"start":27,"value":"349 pence","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":44,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then the Stripe refund API receives \"349\" as the amount","stepMatchArguments":[{"group":{"start":31,"value":"\"349\"","children":[{"start":32,"value":"349","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":45,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"And the customer's card is credited \"£3.49\"","stepMatchArguments":[{"group":{"start":32,"value":"\"£3.49\"","children":[{"start":33,"value":"£3.49","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end