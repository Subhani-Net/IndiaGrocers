// Generated from: e2e\features\account\registration.feature
import { test } from "playwright-bdd";

test.describe('Account Registration', () => {

  test('Register a new customer account', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to "/account"', null, { page }); 
    await When('the user clicks "Join us"', null, { page }); 
    await Then('the registration form is displayed', null, { page }); 
    await And('the form includes first name, last name, email, phone, and password fields', null, { page }); 
  });

  test('Password strength rules show real-time validation', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, page }) => { 
    await Given('the registration form is shown', null, { page }); 
    await When('the user types a short password of less than 8 characters', null, { page }); 
    await Then('the "At least 8 characters" rule is not satisfied', null, { page }); 
    await When('the user types 8 characters without a letter', null, { page }); 
    await Then('the "At least 1 letter" rule is not satisfied', null, { page }); 
    await When('the user types 8 characters without a number', null, { page }); 
    await Then('the "At least 1 number" rule is not satisfied', null, { page }); 
    await When('the user types a valid password meeting all rules', null, { page }); 
    await Then('all 3 password rules show as satisfied', null, { page }); 
  });

  test('Register with valid credentials', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the registration form is displayed', null, { page }); 
    await When('the user fills in valid registration details', null, { page }); 
    await And('the user submits the registration form', null, { page }); 
    await Then('the user is redirected to the account dashboard', null, { page }); 
    await And('the dashboard displays the user\'s name and email', null, { page }); 
  });

  test('Duplicate email registration shows error', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, page }) => { 
    await Given('an account exists with "test@example.com"', null, { page }); 
    await When('the user attempts to register with "test@example.com"', null, { page }); 
    await Then('an error message "An account with this email already exists" is displayed', null, { page }); 
  });

  test('Invalid email format shows validation error', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the registration form is displayed', null, { page }); 
    await When('the user enters an invalid email format', null, { page }); 
    await And('the user submits the registration form', null, { page }); 
    await Then('a validation error for email is displayed', null, { page }); 
  });

  test('Empty required fields show validation errors', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, page }) => { 
    await Given('the registration form is displayed', null, { page }); 
    await When('the user submits the registration form with empty fields', null, { page }); 
    await Then('validation errors are displayed for required fields', null, { page }); 
  });

  test('Verification email is sent on successful registration', { tag: ['@W04', '@account', '@auth', '@G3', '@email-verify'] }, async ({ Given, Then }) => { 
    await Given('the user has registered with a valid email'); 
    await Then('a verification email is sent to the registered email address'); 
  });

  test('Unverified account is gated from the dashboard', { tag: ['@W04', '@account', '@auth', '@G3', '@email-verify'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has registered but not verified their email'); 
    await When('the user navigates to "/account"', null, { page }); 
    await Then('the user is redirected to a verification prompt'); 
    await And('a message to check email for the verification link is displayed'); 
  });

  test('Verified account can access the dashboard', { tag: ['@W04', '@account', '@auth', '@G3', '@email-verify'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has verified their email'); 
    await When('the user navigates to "/account"', null, { page }); 
    await Then('the account dashboard is displayed', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\account\\registration.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":16,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":7,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When the user clicks \"Join us\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Join us\"","children":[{"start":17,"value":"Join us","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the registration form is displayed","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the form includes first name, last name, email, phone, and password fields","stepMatchArguments":[]}]},
  {"pwTestLine":13,"pickleLine":22,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":14,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given the registration form is shown","stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When the user types a short password of less than 8 characters","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"Then the \"At least 8 characters\" rule is not satisfied","stepMatchArguments":[{"group":{"start":4,"value":"\"At least 8 characters\"","children":[{"start":5,"value":"At least 8 characters","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"When the user types 8 characters without a letter","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the \"At least 1 letter\" rule is not satisfied","stepMatchArguments":[{"group":{"start":4,"value":"\"At least 1 letter\"","children":[{"start":5,"value":"At least 1 letter","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":19,"gherkinStepLine":28,"keywordType":"Action","textWithKeyword":"When the user types 8 characters without a number","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then the \"At least 1 number\" rule is not satisfied","stepMatchArguments":[{"group":{"start":4,"value":"\"At least 1 number\"","children":[{"start":5,"value":"At least 1 number","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When the user types a valid password meeting all rules","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then all 3 password rules show as satisfied","stepMatchArguments":[]}]},
  {"pwTestLine":25,"pickleLine":33,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":26,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given the registration form is displayed","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":35,"keywordType":"Action","textWithKeyword":"When the user fills in valid registration details","stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"And the user submits the registration form","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then the user is redirected to the account dashboard","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":38,"keywordType":"Outcome","textWithKeyword":"And the dashboard displays the user's name and email","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":40,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":34,"gherkinStepLine":41,"keywordType":"Context","textWithKeyword":"Given an account exists with \"test@example.com\"","stepMatchArguments":[{"group":{"start":23,"value":"\"test@example.com\"","children":[{"start":24,"value":"test@example.com","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"When the user attempts to register with \"test@example.com\"","stepMatchArguments":[{"group":{"start":35,"value":"\"test@example.com\"","children":[{"start":36,"value":"test@example.com","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":36,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"Then an error message \"An account with this email already exists\" is displayed","stepMatchArguments":[{"group":{"start":17,"value":"\"An account with this email already exists\"","children":[{"start":18,"value":"An account with this email already exists","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":39,"pickleLine":45,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":40,"gherkinStepLine":46,"keywordType":"Context","textWithKeyword":"Given the registration form is displayed","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":47,"keywordType":"Action","textWithKeyword":"When the user enters an invalid email format","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":48,"keywordType":"Action","textWithKeyword":"And the user submits the registration form","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"Then a validation error for email is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":46,"pickleLine":51,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":47,"gherkinStepLine":52,"keywordType":"Context","textWithKeyword":"Given the registration form is displayed","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":53,"keywordType":"Action","textWithKeyword":"When the user submits the registration form with empty fields","stepMatchArguments":[]},{"pwStepLine":49,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"Then validation errors are displayed for required fields","stepMatchArguments":[]}]},
  {"pwTestLine":52,"pickleLine":57,"tags":["@W04","@account","@auth","@G3","@email-verify"],"steps":[{"pwStepLine":53,"gherkinStepLine":58,"keywordType":"Context","textWithKeyword":"Given the user has registered with a valid email","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"Then a verification email is sent to the registered email address","stepMatchArguments":[]}]},
  {"pwTestLine":57,"pickleLine":62,"tags":["@W04","@account","@auth","@G3","@email-verify"],"steps":[{"pwStepLine":58,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given the user has registered but not verified their email","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":64,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":60,"gherkinStepLine":65,"keywordType":"Outcome","textWithKeyword":"Then the user is redirected to a verification prompt","stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"And a message to check email for the verification link is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":64,"pickleLine":69,"tags":["@W04","@account","@auth","@G3","@email-verify"],"steps":[{"pwStepLine":65,"gherkinStepLine":70,"keywordType":"Context","textWithKeyword":"Given the user has verified their email","stepMatchArguments":[]},{"pwStepLine":66,"gherkinStepLine":71,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":67,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"Then the account dashboard is displayed","stepMatchArguments":[]}]},
]; // bdd-data-end