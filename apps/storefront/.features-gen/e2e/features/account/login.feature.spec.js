// Generated from: e2e\features\account\login.feature
import { test } from "playwright-bdd";

test.describe('Account Sign In and Password Reset', () => {

  test('Sign in with valid credentials', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to "/account"', null, { page }); 
    await When('the user enters valid email and password', null, { page }); 
    await And('the user clicks "Sign in"', null, { page }); 
    await Then('the user is redirected to the account dashboard', null, { page }); 
    await And('the dashboard displays the user\'s name', null, { page }); 
  });

  test('Sign in with invalid credentials shows error', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to "/account"', null, { page }); 
    await When('the user enters an incorrect email or password', null, { page }); 
    await And('the user clicks "Sign in"', null, { page }); 
    await Then('an error message is displayed', null, { page }); 
  });

  test('Sign in with empty fields shows validation', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user navigates to "/account"', null, { page }); 
    await When('the user clicks "Sign in" with empty fields', null, { page }); 
    await Then('browser validation indicates required fields', null, { page }); 
  });

  test('Sign in transitions to dashboard without manual refresh', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user has valid credentials', null, { page }); 
    await When('the user signs in successfully', null, { page }); 
    await Then('the dashboard is displayed without requiring a manual page refresh', null, { page }); 
  });

  test('Forgot password — request a reset code', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to "/account"', null, { page }); 
    await When('the user clicks "Forgot your password?"', null, { page }); 
    await Then('the password reset form is displayed', null, { page }); 
    await When('the user enters their email', null, { page }); 
    await And('the user clicks "Send Reset Code"', null, { page }); 
    await Then('a confirmation message "Check Your Email" is displayed', null, { page }); 
    await And('the email field is pre-filled', null, { page }); 
  });

  test('Reset password with a valid code', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has received a reset code via email', null, { page }); 
    await When('the user enters the reset code on the reset form', null, { page }); 
    await And('the user enters a new password meeting all rules', null, { page }); 
    await And('the user confirms the new password', null, { page }); 
    await And('the user clicks "Reset Password"', null, { page }); 
    await Then('a "Password Updated" confirmation is displayed', null, { page }); 
    await And('the user can sign in with the new password', null, { page }); 
  });

  test('Reset password with mismatched passwords shows error', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on the reset password form', null, { page }); 
    await When('the user enters different passwords in "New Password" and "Confirm Password"', null, { page }); 
    await And('the user clicks "Reset Password"', null, { page }); 
    await Then('an error "Passwords do not match" is displayed', null, { page }); 
  });

  test('Reset password with a weak password shows validation', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on the reset password form', null, { page }); 
    await When('the user enters a password shorter than 8 characters', null, { page }); 
    await And('the user clicks "Reset Password"', null, { page }); 
    await Then('a password strength error is displayed', null, { page }); 
  });

  test('Sign out clears session and redirects to login', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in', null, { page }); 
    await When('the user clicks "Log out"', null, { page }); 
    await Then('the user is redirected to "/account"', null, { page }); 
    await And('the sign-in form is displayed', null, { page }); 
    await And('the basket is cleared', null, { page }); 
  });

  test('Protected account pages redirect unauthenticated users', { tag: ['@W04', '@account', '@auth'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is not signed in', null, { page }); 
    await When('the user navigates to "/account/orders"', null, { page }); 
    await Then('the user is redirected to "/account"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\account\\login.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":15,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":7,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When the user enters valid email and password","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"And the user clicks \"Sign in\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Sign in\"","children":[{"start":17,"value":"Sign in","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":10,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the user is redirected to the account dashboard","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the dashboard displays the user's name","stepMatchArguments":[]}]},
  {"pwTestLine":14,"pickleLine":22,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":15,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"When the user enters an incorrect email or password","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"And the user clicks \"Sign in\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Sign in\"","children":[{"start":17,"value":"Sign in","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then an error message is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":21,"pickleLine":28,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":22,"gherkinStepLine":29,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When the user clicks \"Sign in\" with empty fields","stepMatchArguments":[{"group":{"start":16,"value":"\"Sign in\"","children":[{"start":17,"value":"Sign in","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then browser validation indicates required fields","stepMatchArguments":[]}]},
  {"pwTestLine":27,"pickleLine":33,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":28,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given the user has valid credentials","stepMatchArguments":[]},{"pwStepLine":29,"gherkinStepLine":35,"keywordType":"Action","textWithKeyword":"When the user signs in successfully","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"Then the dashboard is displayed without requiring a manual page refresh","stepMatchArguments":[]}]},
  {"pwTestLine":33,"pickleLine":38,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":34,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/account\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account\"","children":[{"start":23,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When the user clicks \"Forgot your password?\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Forgot your password?\"","children":[{"start":17,"value":"Forgot your password?","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":36,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the password reset form is displayed","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":42,"keywordType":"Action","textWithKeyword":"When the user enters their email","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":43,"keywordType":"Action","textWithKeyword":"And the user clicks \"Send Reset Code\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Send Reset Code\"","children":[{"start":17,"value":"Send Reset Code","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":39,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"Then a confirmation message \"Check Your Email\" is displayed","stepMatchArguments":[{"group":{"start":23,"value":"\"Check Your Email\"","children":[{"start":24,"value":"Check Your Email","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":40,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And the email field is pre-filled","stepMatchArguments":[]}]},
  {"pwTestLine":43,"pickleLine":47,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":44,"gherkinStepLine":48,"keywordType":"Context","textWithKeyword":"Given the user has received a reset code via email","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":49,"keywordType":"Action","textWithKeyword":"When the user enters the reset code on the reset form","stepMatchArguments":[]},{"pwStepLine":46,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"And the user enters a new password meeting all rules","stepMatchArguments":[]},{"pwStepLine":47,"gherkinStepLine":51,"keywordType":"Action","textWithKeyword":"And the user confirms the new password","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":52,"keywordType":"Action","textWithKeyword":"And the user clicks \"Reset Password\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Reset Password\"","children":[{"start":17,"value":"Reset Password","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":49,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"Then a \"Password Updated\" confirmation is displayed","stepMatchArguments":[{"group":{"start":2,"value":"\"Password Updated\"","children":[{"start":3,"value":"Password Updated","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":50,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"And the user can sign in with the new password","stepMatchArguments":[]}]},
  {"pwTestLine":53,"pickleLine":56,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":54,"gherkinStepLine":57,"keywordType":"Context","textWithKeyword":"Given the user is on the reset password form","stepMatchArguments":[]},{"pwStepLine":55,"gherkinStepLine":58,"keywordType":"Action","textWithKeyword":"When the user enters different passwords in \"New Password\" and \"Confirm Password\"","stepMatchArguments":[{"group":{"start":39,"value":"\"New Password\"","children":[{"start":40,"value":"New Password","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"},{"group":{"start":58,"value":"\"Confirm Password\"","children":[{"start":59,"value":"Confirm Password","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":56,"gherkinStepLine":59,"keywordType":"Action","textWithKeyword":"And the user clicks \"Reset Password\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Reset Password\"","children":[{"start":17,"value":"Reset Password","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":57,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"Then an error \"Passwords do not match\" is displayed","stepMatchArguments":[{"group":{"start":9,"value":"\"Passwords do not match\"","children":[{"start":10,"value":"Passwords do not match","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":60,"pickleLine":62,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":61,"gherkinStepLine":63,"keywordType":"Context","textWithKeyword":"Given the user is on the reset password form","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":64,"keywordType":"Action","textWithKeyword":"When the user enters a password shorter than 8 characters","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":65,"keywordType":"Action","textWithKeyword":"And the user clicks \"Reset Password\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Reset Password\"","children":[{"start":17,"value":"Reset Password","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":64,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then a password strength error is displayed","stepMatchArguments":[]}]},
  {"pwTestLine":67,"pickleLine":68,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":68,"gherkinStepLine":69,"keywordType":"Context","textWithKeyword":"Given the user is signed in","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":70,"keywordType":"Action","textWithKeyword":"When the user clicks \"Log out\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Log out\"","children":[{"start":17,"value":"Log out","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":70,"gherkinStepLine":71,"keywordType":"Outcome","textWithKeyword":"Then the user is redirected to \"/account\"","stepMatchArguments":[{"group":{"start":26,"value":"\"/account\"","children":[{"start":27,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":71,"gherkinStepLine":72,"keywordType":"Outcome","textWithKeyword":"And the sign-in form is displayed","stepMatchArguments":[]},{"pwStepLine":72,"gherkinStepLine":73,"keywordType":"Outcome","textWithKeyword":"And the basket is cleared","stepMatchArguments":[]}]},
  {"pwTestLine":75,"pickleLine":75,"tags":["@W04","@account","@auth"],"steps":[{"pwStepLine":76,"gherkinStepLine":76,"keywordType":"Context","textWithKeyword":"Given the user is not signed in","stepMatchArguments":[]},{"pwStepLine":77,"gherkinStepLine":77,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/account/orders\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/account/orders\"","children":[{"start":23,"value":"/account/orders","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":78,"gherkinStepLine":78,"keywordType":"Outcome","textWithKeyword":"Then the user is redirected to \"/account\"","stepMatchArguments":[{"group":{"start":26,"value":"\"/account\"","children":[{"start":27,"value":"/account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end