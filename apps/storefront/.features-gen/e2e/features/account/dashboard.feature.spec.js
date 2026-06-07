// Generated from: e2e\features\account\dashboard.feature
import { test } from "playwright-bdd";

test.describe('Account Dashboard and Profile Management', () => {

  test('View account overview dashboard', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in', null, { page }); 
    await When('the user navigates to "/account"', null, { page }); 
    await Then('the overview displays a welcome message with the user\'s name', null, { page }); 
    await And('the overview displays the user\'s email', null, { page }); 
    await And('the overview displays a profile completion bar', null, { page }); 
    await And('the overview displays saved addresses count', null, { page }); 
    await And('the overview displays total orders count', null, { page }); 
  });

  test('View recent orders on the overview', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in with previous orders', null, { page }); 
    await When('the user views the account overview', null, { page }); 
    await Then('the overview displays the 5 most recent orders', null, { page }); 
    await And('each order shows a status badge', null, { page }); 
  });

  test('Customer with no orders sees an empty state', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in with no orders', null, { page }); 
    await When('the user views the account overview', null, { page }); 
    await Then('the overview displays "No recent orders"', null, { page }); 
    await And('the overview displays a "Start Shopping" call-to-action', null, { page }); 
  });

  test('View full order history', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in with previous orders', null, { page }); 
    await When('the user clicks "Orders" in the account sidebar', null, { page }); 
    await Then('a list of order cards is displayed', null, { page }); 
    await And('each card shows the order number, date, status, and total', null, { page }); 
  });

  test('View order details', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is viewing their order history', null, { page }); 
    await When('the user clicks an order card', null, { page }); 
    await Then('the full order details are displayed', null, { page }); 
    await And('the items in the order are listed', null, { page }); 
    await And('the shipping details are displayed', null, { page }); 
    await And('the order summary is displayed', null, { page }); 
  });

  test('No orders shows empty state on orders page', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in with no orders', null, { page }); 
    await When('the user clicks "Orders" in the account sidebar', null, { page }); 
    await Then('an empty state message is displayed', null, { page }); 
    await And('a "Continue shopping" link is displayed', null, { page }); 
  });

  test('Add a new address', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is signed in and viewing "Addresses"', null, { page }); 
    await When('the user clicks "Add address"', null, { page }); 
    await Then('a modal opens with address fields', null, { page }); 
    await When('the user fills in all required fields and saves', null, { page }); 
    await Then('the new address appears in the address grid', null, { page }); 
  });

  test('Edit an existing address', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has at least one saved address', null, { page }); 
    await When('the user clicks "Edit" on an address card', null, { page }); 
    await Then('the address fields are populated with current values', null, { page }); 
    await When('the user modifies fields and saves', null, { page }); 
    await Then('the address is updated', null, { page }); 
  });

  test('Delete an address', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has at least one saved address', null, { page }); 
    await When('the user clicks "Delete" on an address card', null, { page }); 
    await Then('the address is removed from the grid', null, { page }); 
  });

  test('Edit profile — change name', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in and viewing "Profile"', null, { page }); 
    await When('the user clicks edit on the name field', null, { page }); 
    await And('the user enters a new name and saves', null, { page }); 
    await Then('the name is updated across the dashboard', null, { page }); 
  });

  test('Edit profile — change email', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in and viewing "Profile"', null, { page }); 
    await When('the user clicks edit on the email field', null, { page }); 
    await And('the user enters a new email and saves', null, { page }); 
    await Then('the email is updated', null, { page }); 
  });

  test('Edit profile — change phone number', { tag: ['@W04', '@account'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in and viewing "Profile"', null, { page }); 
    await When('the user clicks edit on the phone field', null, { page }); 
    await And('the user enters a new phone number and saves', null, { page }); 
    await Then('the phone number is updated', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\account\\dashboard.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":14,"tags":["@W04","@account"],"steps":[{"pwStepLine":7,"gherkinStepLine":15,"keywordType":"Context","textWithKeyword":"Given the user is signed in","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then the overview displays a welcome message with the user's name","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the overview displays the user's email","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And the overview displays a profile completion bar","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the overview displays saved addresses count","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And the overview displays total orders count","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":23,"tags":["@W04","@account"],"steps":[{"pwStepLine":17,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given the user is signed in with previous orders","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the user views the account overview","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then the overview displays the 5 most recent orders","stepMatchArguments":[{"group":{"start":26,"value":"5"},"parameterTypeName":"int"}]},{"pwStepLine":20,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And each order shows a status badge","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":29,"tags":["@W04","@account"],"steps":[{"pwStepLine":24,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given the user is signed in with no orders","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When the user views the account overview","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then the overview displays \"No recent orders\"","stepMatchArguments":[{"group":{"start":22,"value":"\"No recent orders\"","children":[{"start":23,"value":"No recent orders","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":27,"gherkinStepLine":33,"keywordType":"Outcome","textWithKeyword":"And the overview displays a \"Start Shopping\" call-to-action","stepMatchArguments":[{"group":{"start":24,"value":"\"Start Shopping\"","children":[{"start":25,"value":"Start Shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":30,"pickleLine":35,"tags":["@W04","@account"],"steps":[{"pwStepLine":31,"gherkinStepLine":36,"keywordType":"Context","textWithKeyword":"Given the user is signed in with previous orders","stepMatchArguments":[]},{"pwStepLine":32,"gherkinStepLine":37,"keywordType":"Action","textWithKeyword":"When the user clicks \"Orders\" in the account sidebar","stepMatchArguments":[{"group":{"start":16,"value":"\"Orders\"","children":[{"start":17,"value":"Orders","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":33,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"Then a list of order cards is displayed","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":39,"keywordType":"Outcome","textWithKeyword":"And each card shows the order number, date, status, and total","stepMatchArguments":[]}]},
  {"pwTestLine":37,"pickleLine":41,"tags":["@W04","@account"],"steps":[{"pwStepLine":38,"gherkinStepLine":42,"keywordType":"Context","textWithKeyword":"Given the user is viewing their order history","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"When the user clicks an order card","stepMatchArguments":[]},{"pwStepLine":40,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then the full order details are displayed","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And the items in the order are listed","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"And the shipping details are displayed","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"And the order summary is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":46,"pickleLine":49,"tags":["@W04","@account"],"steps":[{"pwStepLine":47,"gherkinStepLine":50,"keywordType":"Context","textWithKeyword":"Given the user is signed in with no orders","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":51,"keywordType":"Action","textWithKeyword":"When the user clicks \"Orders\" in the account sidebar","stepMatchArguments":[{"group":{"start":16,"value":"\"Orders\"","children":[{"start":17,"value":"Orders","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":49,"gherkinStepLine":52,"keywordType":"Outcome","textWithKeyword":"Then an empty state message is displayed","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"And a \"Continue shopping\" link is displayed","stepMatchArguments":[{"group":{"start":2,"value":"\"Continue shopping\"","children":[{"start":3,"value":"Continue shopping","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":53,"pickleLine":55,"tags":["@W04","@account"],"steps":[{"pwStepLine":54,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"Given the user is signed in and viewing \"Addresses\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Addresses\"","children":[{"start":35,"value":"Addresses","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":55,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When the user clicks \"Add address\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Add address\"","children":[{"start":17,"value":"Add address","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":56,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then a modal opens with address fields","stepMatchArguments":[]},{"pwStepLine":57,"gherkinStepLine":59,"keywordType":"Action","textWithKeyword":"When the user fills in all required fields and saves","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"Then the new address appears in the address grid","stepMatchArguments":[]}]},
  {"pwTestLine":61,"pickleLine":62,"tags":["@W04","@account"],"steps":[{"pwStepLine":62,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given the user has at least one saved address","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":64,"keywordType":"Action","textWithKeyword":"When the user clicks \"Edit\" on an address card","stepMatchArguments":[{"group":{"start":16,"value":"\"Edit\"","children":[{"start":17,"value":"Edit","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":64,"gherkinStepLine":65,"keywordType":"Outcome","textWithKeyword":"Then the address fields are populated with current values","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":66,"keywordType":"Action","textWithKeyword":"When the user modifies fields and saves","stepMatchArguments":[]},{"pwStepLine":66,"gherkinStepLine":67,"keywordType":"Outcome","textWithKeyword":"Then the address is updated","stepMatchArguments":[]}]},
  {"pwTestLine":69,"pickleLine":69,"tags":["@W04","@account"],"steps":[{"pwStepLine":70,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"Given the user has at least one saved address","stepMatchArguments":[]},{"pwStepLine":71,"gherkinStepLine":71,"keywordType":"Action","textWithKeyword":"When the user clicks \"Delete\" on an address card","stepMatchArguments":[{"group":{"start":16,"value":"\"Delete\"","children":[{"start":17,"value":"Delete","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":72,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"Then the address is removed from the grid","stepMatchArguments":[]}]},
  {"pwTestLine":75,"pickleLine":74,"tags":["@W04","@account"],"steps":[{"pwStepLine":76,"gherkinStepLine":75,"keywordType":"Context","textWithKeyword":"Given the user is signed in and viewing \"Profile\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Profile\"","children":[{"start":35,"value":"Profile","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":77,"gherkinStepLine":76,"keywordType":"Action","textWithKeyword":"When the user clicks edit on the name field","stepMatchArguments":[]},{"pwStepLine":78,"gherkinStepLine":77,"keywordType":"Action","textWithKeyword":"And the user enters a new name and saves","stepMatchArguments":[]},{"pwStepLine":79,"gherkinStepLine":78,"keywordType":"Outcome","textWithKeyword":"Then the name is updated across the dashboard","stepMatchArguments":[]}]},
  {"pwTestLine":82,"pickleLine":80,"tags":["@W04","@account"],"steps":[{"pwStepLine":83,"gherkinStepLine":81,"keywordType":"Context","textWithKeyword":"Given the user is signed in and viewing \"Profile\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Profile\"","children":[{"start":35,"value":"Profile","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":84,"gherkinStepLine":82,"keywordType":"Action","textWithKeyword":"When the user clicks edit on the email field","stepMatchArguments":[]},{"pwStepLine":85,"gherkinStepLine":83,"keywordType":"Action","textWithKeyword":"And the user enters a new email and saves","stepMatchArguments":[]},{"pwStepLine":86,"gherkinStepLine":84,"keywordType":"Outcome","textWithKeyword":"Then the email is updated","stepMatchArguments":[]}]},
  {"pwTestLine":89,"pickleLine":86,"tags":["@W04","@account"],"steps":[{"pwStepLine":90,"gherkinStepLine":87,"keywordType":"Context","textWithKeyword":"Given the user is signed in and viewing \"Profile\"","stepMatchArguments":[{"group":{"start":34,"value":"\"Profile\"","children":[{"start":35,"value":"Profile","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":91,"gherkinStepLine":88,"keywordType":"Action","textWithKeyword":"When the user clicks edit on the phone field","stepMatchArguments":[]},{"pwStepLine":92,"gherkinStepLine":89,"keywordType":"Action","textWithKeyword":"And the user enters a new phone number and saves","stepMatchArguments":[]},{"pwStepLine":93,"gherkinStepLine":90,"keywordType":"Outcome","textWithKeyword":"Then the phone number is updated","stepMatchArguments":[]}]},
]; // bdd-data-end