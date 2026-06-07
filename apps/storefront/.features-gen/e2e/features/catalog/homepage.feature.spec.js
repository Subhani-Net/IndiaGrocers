// Generated from: e2e\features\catalog\homepage.feature
import { test } from "playwright-bdd";

test.describe('Homepage', () => {

  test('Guest visitor lands on the homepage', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to "/"', null, { page }); 
    await Then('the page returns HTTP 200', null, { page }); 
    await And('the page displays a hero section', null, { page }); 
    await And('the page displays a category grid', null, { page }); 
    await And('the page displays promo banners', null, { page }); 
    await And('the page displays the testimonials section', null, { page }); 
    await And('the page displays a WhatsApp contact button', null, { page }); 
  });

  test('Guest visitor sees the new customer onboarding prompt', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to "/"', null, { page }); 
    await Then('the page displays a regional preference prompt', null, { page }); 
    await And('the prompt includes South Asian cuisine options', null, { page }); 
  });

  test('Guest dismisses the regional preference prompt', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to "/"', null, { page }); 
    await And('the regional preference prompt is visible', null, { page }); 
    await When('the user dismisses the preference prompt', null, { page }); 
    await Then('the prompt disappears'); 
    await And('the homepage remains fully functional', null, { page }); 
  });

  test('Guest selects a regional preference', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to "/"', null, { page }); 
    await And('the regional preference prompt is visible', null, { page }); 
    await When('the user selects a regional preference', null, { page }); 
    await Then('the user is navigated to the store page', null, { page }); 
  });

  test('Authenticated customer with no orders sees personalised homepage', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in as a new customer with no orders'); 
    await When('the user navigates to "/"', null, { page }); 
    await Then('the page displays a welcome message with the user\'s name', null, { page }); 
    await And('the page displays the new customer onboarding prompt', null, { page }); 
    await And('the page does not display a weekly shop card', null, { page }); 
    await And('the header displays the user\'s name instead of "Account"', null, { page }); 
  });

  test('Authenticated customer with order history sees tailored homepage', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is signed in as a returning customer'); 
    await When('the user navigates to "/"', null, { page }); 
    await Then('the page displays a welcome back message', null, { page }); 
    await And('the page displays the user\'s last order date'); 
    await And('the page displays a Weekly Shop card'); 
    await And('the page displays a Quick Reorder shelf'); 
    await And('the page displays a category reminder strip'); 
  });

  test('Desktop header shows Browse mega menu and Account link', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user is on the homepage', null, { page }); 
    await Then('the desktop header displays a Browse button', null, { page }); 
    await And('the desktop header displays an Account link', null, { page }); 
  });

  test('Mobile devices show a bottom navigation bar', { tag: ['@W01', '@homepage', '@smoke'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on a mobile device', null, { page }); 
    await When('the user views the homepage', null, { page }); 
    await Then('the bottom navigation shows 5 tabs: Home, Search, Browse, Reorder, Account', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\catalog\\homepage.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":16,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":7,"gherkinStepLine":17,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/\"","children":[{"start":23,"value":"/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then the page returns HTTP 200","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And the page displays a hero section","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the page displays a category grid","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And the page displays promo banners","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"And the page displays the testimonials section","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"And the page displays a WhatsApp contact button","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":25,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":17,"gherkinStepLine":26,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/\"","children":[{"start":23,"value":"/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then the page displays a regional preference prompt","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"And the prompt includes South Asian cuisine options","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":30,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":23,"gherkinStepLine":31,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/\"","children":[{"start":23,"value":"/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":32,"keywordType":"Context","textWithKeyword":"And the regional preference prompt is visible","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":33,"keywordType":"Action","textWithKeyword":"When the user dismisses the preference prompt","stepMatchArguments":[]},{"pwStepLine":26,"gherkinStepLine":34,"keywordType":"Outcome","textWithKeyword":"Then the prompt disappears","stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"And the homepage remains fully functional","stepMatchArguments":[]}]},
  {"pwTestLine":30,"pickleLine":37,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":31,"gherkinStepLine":38,"keywordType":"Context","textWithKeyword":"Given the user navigates to \"/\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/\"","children":[{"start":23,"value":"/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"And the regional preference prompt is visible","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When the user selects a regional preference","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to the store page","stepMatchArguments":[]}]},
  {"pwTestLine":37,"pickleLine":43,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":38,"gherkinStepLine":44,"keywordType":"Context","textWithKeyword":"Given the user is signed in as a new customer with no orders","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":45,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/\"","children":[{"start":23,"value":"/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":40,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"Then the page displays a welcome message with the user's name","stepMatchArguments":[]},{"pwStepLine":41,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"And the page displays the new customer onboarding prompt","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"And the page does not display a weekly shop card","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"And the header displays the user's name instead of \"Account\"","stepMatchArguments":[{"group":{"start":47,"value":"\"Account\"","children":[{"start":48,"value":"Account","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":46,"pickleLine":51,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":47,"gherkinStepLine":52,"keywordType":"Context","textWithKeyword":"Given the user is signed in as a returning customer","stepMatchArguments":[]},{"pwStepLine":48,"gherkinStepLine":53,"keywordType":"Action","textWithKeyword":"When the user navigates to \"/\"","stepMatchArguments":[{"group":{"start":22,"value":"\"/\"","children":[{"start":23,"value":"/","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":49,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"Then the page displays a welcome back message","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":55,"keywordType":"Outcome","textWithKeyword":"And the page displays the user's last order date","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":56,"keywordType":"Outcome","textWithKeyword":"And the page displays a Weekly Shop card","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":57,"keywordType":"Outcome","textWithKeyword":"And the page displays a Quick Reorder shelf","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"And the page displays a category reminder strip","stepMatchArguments":[]}]},
  {"pwTestLine":56,"pickleLine":60,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":57,"gherkinStepLine":61,"keywordType":"Context","textWithKeyword":"Given the user is on the homepage","stepMatchArguments":[]},{"pwStepLine":58,"gherkinStepLine":62,"keywordType":"Outcome","textWithKeyword":"Then the desktop header displays a Browse button","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"And the desktop header displays an Account link","stepMatchArguments":[]}]},
  {"pwTestLine":62,"pickleLine":65,"tags":["@W01","@homepage","@smoke"],"steps":[{"pwStepLine":63,"gherkinStepLine":66,"keywordType":"Context","textWithKeyword":"Given the user is on a mobile device","stepMatchArguments":[]},{"pwStepLine":64,"gherkinStepLine":67,"keywordType":"Action","textWithKeyword":"When the user views the homepage","stepMatchArguments":[]},{"pwStepLine":65,"gherkinStepLine":68,"keywordType":"Outcome","textWithKeyword":"Then the bottom navigation shows 5 tabs: Home, Search, Browse, Reorder, Account","stepMatchArguments":[]}]},
]; // bdd-data-end