// Generated from: e2e\features\checkout\order-modification.feature
import { test } from "playwright-bdd";

test.describe('Order Modification and Weight-Based Charging', () => {

  test('Packer marks an item as unavailable', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And }) => { 
    await Given('an order contains a product that is out of stock'); 
    await When('the packer marks the item as unavailable'); 
    await Then('the order total is recalculated without the unavailable item'); 
    await And('the existing Stripe PaymentIntent is updated with the new total'); 
  });

  test('Packer substitutes an item', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And }) => { 
    await Given('an order contains a product that is out of stock'); 
    await When('the packer substitutes it with a similar available product'); 
    await Then('the order total reflects the substituted product\'s price'); 
    await And('the PaymentIntent is updated accordingly'); 
  });

  test('Weight-based product — actual weight exceeds estimate', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('a customer ordered 1kg of loose paneer at an estimated price of £8.00'); 
    await When('the packer weighs the actual paneer and records "1050g"', null, { page }); 
    await Then('the PaymentIntent amount is updated to "£8.40"', null, { page }); 
    await And('the customer is charged the actual weight-based amount'); 
  });

  test('Weight-based product — actual weight is less than estimate', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('a customer ordered 1kg of loose paneer at an estimated price of £8.00'); 
    await When('the packer weighs the actual paneer and records "950g"', null, { page }); 
    await Then('the PaymentIntent amount is updated to "£7.60"', null, { page }); 
    await And('the customer is charged only for the actual weight'); 
  });

  test('Customer receives updated order after packing', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And }) => { 
    await Given('the packer has adjusted an order during packing'); 
    await When('the adjustments are saved'); 
    await Then('the customer receives an email with the updated order summary'); 
    await And('the updated total is displayed in their order history'); 
  });

  test('Payment is captured after packing adjustments', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And }) => { 
    await Given('an order has been packed and adjusted'); 
    await When('the packer confirms the order is ready for delivery'); 
    await Then('the PaymentIntent is captured at the final adjusted amount'); 
    await And('no additional payment authorization is required'); 
  });

  test('Order cannot be modified after the packing window closes', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And }) => { 
    await Given('the packing window for an order has closed'); 
    await When('the packer attempts to modify the order'); 
    await Then('the modification is rejected'); 
    await And('the order proceeds to delivery with its current state'); 
  });

  test('Payment update uses the same PaymentIntent', { tag: ['@W03', '@checkout', '@order-modification'] }, async ({ Given, When, Then, And }) => { 
    await Given('an existing PaymentIntent for an order'); 
    await When('the order total is adjusted during packing'); 
    await Then('the updatePayment method is called on the same PaymentIntent'); 
    await And('no new PaymentIntent is created'); 
    await And('no additional payment authorization is required from the customer'); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\checkout\\order-modification.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":14,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":7,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given an order contains a product that is out of stock","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When the packer marks the item as unavailable","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then the order total is recalculated without the unavailable item","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the existing Stripe PaymentIntent is updated with the new total","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":20,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":14,"gherkinStepLine":21,"keywordType":"Context","textWithKeyword":"Given an order contains a product that is out of stock","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When the packer substitutes it with a similar available product","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then the order total reflects the substituted product's price","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"And the PaymentIntent is updated accordingly","stepMatchArguments":[]}]},
  {"pwTestLine":20,"pickleLine":26,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":21,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given a customer ordered 1kg of loose paneer at an estimated price of £8.00","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When the packer weighs the actual paneer and records \"1050g\"","stepMatchArguments":[{"group":{"start":48,"value":"\"1050g\"","children":[{"start":49,"value":"1050g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then the PaymentIntent amount is updated to \"£8.40\"","stepMatchArguments":[{"group":{"start":39,"value":"\"£8.40\"","children":[{"start":40,"value":"£8.40","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"And the customer is charged the actual weight-based amount","stepMatchArguments":[]}]},
  {"pwTestLine":27,"pickleLine":32,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":28,"gherkinStepLine":33,"keywordType":"Context","textWithKeyword":"Given a customer ordered 1kg of loose paneer at an estimated price of £8.00","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":34,"keywordType":"Action","textWithKeyword":"When the packer weighs the actual paneer and records \"950g\"","stepMatchArguments":[{"group":{"start":48,"value":"\"950g\"","children":[{"start":49,"value":"950g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the PaymentIntent amount is updated to \"£7.60\"","stepMatchArguments":[{"group":{"start":39,"value":"\"£7.60\"","children":[{"start":40,"value":"£7.60","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":31,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And the customer is charged only for the actual weight","stepMatchArguments":[]}]},
  {"pwTestLine":34,"pickleLine":38,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":35,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given the packer has adjusted an order during packing","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When the adjustments are saved","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the customer receives an email with the updated order summary","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And the updated total is displayed in their order history","stepMatchArguments":[]}]},
  {"pwTestLine":41,"pickleLine":44,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":42,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given an order has been packed and adjusted","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When the packer confirms the order is ready for delivery","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then the PaymentIntent is captured at the final adjusted amount","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"And no additional payment authorization is required","stepMatchArguments":[]}]},
  {"pwTestLine":48,"pickleLine":50,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":49,"gherkinStepLine":51,"keywordType":"Context","textWithKeyword":"Given the packing window for an order has closed","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":52,"keywordType":"Action","textWithKeyword":"When the packer attempts to modify the order","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then the modification is rejected","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"And the order proceeds to delivery with its current state","stepMatchArguments":[]}]},
  {"pwTestLine":55,"pickleLine":56,"tags":["@W03","@checkout","@order-modification"],"steps":[{"pwStepLine":56,"gherkinStepLine":57,"keywordType":"Context","textWithKeyword":"Given an existing PaymentIntent for an order","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":58,"keywordType":"Action","textWithKeyword":"When the order total is adjusted during packing","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"Then the updatePayment method is called on the same PaymentIntent","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"And no new PaymentIntent is created","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":61,"keywordType":"Outcome","textWithKeyword":"And no additional payment authorization is required from the customer","stepMatchArguments":[]}]},
]; // bdd-data-end