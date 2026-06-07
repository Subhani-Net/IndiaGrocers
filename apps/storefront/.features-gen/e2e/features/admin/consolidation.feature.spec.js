// Generated from: e2e\features\admin\consolidation.feature
import { test } from "playwright-bdd";

test.describe('Admin Order Consolidation', () => {

  test('Consolidate orders for a specific target date', { tag: ['@W08', '@admin', '@consolidation'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the admin is authenticated', null, { page }); 
    await When('the admin sends a consolidation request for "2026-06-01"', null, { page }); 
    await Then('the response includes the target date', null, { page }); 
    await And('the response includes the count of orders found', null, { page }); 
    await And('the response includes consolidated items', null, { page }); 
    await And('the response includes a summary', null, { page }); 
  });

  test('Consolidation with no orders returns an empty result', { tag: ['@W08', '@admin', '@consolidation'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the admin is authenticated', null, { page }); 
    await When('the admin sends a consolidation request for a date with no orders', null, { page }); 
    await Then('the consolidated items list is empty', null, { page }); 
    await And('the orders_found count is zero', null, { page }); 
  });

  test('Invalid target date returns an error', { tag: ['@W08', '@admin', '@consolidation'] }, async ({ Given, When, Then, page }) => { 
    await Given('the admin is authenticated', null, { page }); 
    await When('the admin sends a consolidation request with an invalid date', null, { page }); 
    await Then('the response status is 400', null, { page }); 
  });

  test('Missing target date returns an error', { tag: ['@W08', '@admin', '@consolidation'] }, async ({ Given, When, Then, page }) => { 
    await Given('the admin is authenticated', null, { page }); 
    await When('the admin sends a consolidation request without a target date', null, { page }); 
    await Then('the response status is 400', null, { page }); 
  });

  test('Unauthenticated request is rejected', { tag: ['@W08', '@admin', '@consolidation'] }, async ({ Given, When, Then, page }) => { 
    await Given('the admin is not authenticated', null, { page }); 
    await When('the admin sends a consolidation request', null, { page }); 
    await Then('the response status is 401', null, { page }); 
  });

  test('CSV export format contains required columns', { tag: ['@W08', '@admin', '@consolidation'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the admin is authenticated', null, { page }); 
    await When('the admin sends a consolidation request with CSV format', null, { page }); 
    await Then('the response contains comma-separated values', null, { page }); 
    await And('the columns include product title, SKU, quantity, and category', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\admin\\consolidation.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":15,"tags":["@W08","@admin","@consolidation"],"steps":[{"pwStepLine":7,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given the admin is authenticated","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"When the admin sends a consolidation request for \"2026-06-01\"","stepMatchArguments":[{"group":{"start":44,"value":"\"2026-06-01\"","children":[{"start":45,"value":"2026-06-01","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":9,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"Then the response includes the target date","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And the response includes the count of orders found","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"And the response includes consolidated items","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"And the response includes a summary","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":23,"tags":["@W08","@admin","@consolidation"],"steps":[{"pwStepLine":16,"gherkinStepLine":24,"keywordType":"Context","textWithKeyword":"Given the admin is authenticated","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"When the admin sends a consolidation request for a date with no orders","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":26,"keywordType":"Outcome","textWithKeyword":"Then the consolidated items list is empty","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"And the orders_found count is zero","stepMatchArguments":[]}]},
  {"pwTestLine":22,"pickleLine":29,"tags":["@W08","@admin","@consolidation"],"steps":[{"pwStepLine":23,"gherkinStepLine":30,"keywordType":"Context","textWithKeyword":"Given the admin is authenticated","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When the admin sends a consolidation request with an invalid date","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then the response status is 400","stepMatchArguments":[{"group":{"start":23,"value":"400"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":28,"pickleLine":34,"tags":["@W08","@admin","@consolidation"],"steps":[{"pwStepLine":29,"gherkinStepLine":35,"keywordType":"Context","textWithKeyword":"Given the admin is authenticated","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":36,"keywordType":"Action","textWithKeyword":"When the admin sends a consolidation request without a target date","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"Then the response status is 400","stepMatchArguments":[{"group":{"start":23,"value":"400"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":34,"pickleLine":39,"tags":["@W08","@admin","@consolidation"],"steps":[{"pwStepLine":35,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given the admin is not authenticated","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When the admin sends a consolidation request","stepMatchArguments":[]},{"pwStepLine":37,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"Then the response status is 401","stepMatchArguments":[{"group":{"start":23,"value":"401"},"parameterTypeName":"int"}]}]},
  {"pwTestLine":40,"pickleLine":44,"tags":["@W08","@admin","@consolidation"],"steps":[{"pwStepLine":41,"gherkinStepLine":45,"keywordType":"Context","textWithKeyword":"Given the admin is authenticated","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":46,"keywordType":"Action","textWithKeyword":"When the admin sends a consolidation request with CSV format","stepMatchArguments":[]},{"pwStepLine":43,"gherkinStepLine":47,"keywordType":"Outcome","textWithKeyword":"Then the response contains comma-separated values","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":48,"keywordType":"Outcome","textWithKeyword":"And the columns include product title, SKU, quantity, and category","stepMatchArguments":[]}]},
]; // bdd-data-end