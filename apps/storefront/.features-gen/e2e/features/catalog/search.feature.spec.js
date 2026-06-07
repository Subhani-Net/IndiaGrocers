// Generated from: e2e\features\catalog\search.feature
import { test } from "playwright-bdd";

test.describe('Product Search', () => {

  test('Search for products using an English term', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "basmati"', null, { page }); 
    await Then('the page displays search results', null, { page }); 
    await And('the results include "Tilda Pure Basmati"', null, { page }); 
    await And('the results include "Natco - Basmati Rice India - Bag 5kg"', null, { page }); 
  });

  test('Search for products using a vernacular Hindi term — jeera', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "jeera"', null, { page }); 
    await Then('the page displays search results', null, { page }); 
    await And('the results include "TRS Cumin Seeds"', null, { page }); 
    await And('the results include "Natco - Cumin Seeds 400g"', null, { page }); 
  });

  test('Search for products using a vernacular Hindi term — haldi', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "haldi"', null, { page }); 
    await Then('the page displays search results', null, { page }); 
    await And('the results include "Natco - Turmeric Powder 400g"', null, { page }); 
    await And('the results include "Natco - Turmeric Powder Jar 100g"', null, { page }); 
  });

  test('Search for products using a vernacular Hindi term — chana', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "chana"', null, { page }); 
    await Then('the page displays search results', null, { page }); 
    await And('the results include "Natco - Chanadal Polished 2kg"', null, { page }); 
    await And('the results include "Natco - Brown Chick Peas 2kg"', null, { page }); 
  });

  test('Search shows autocomplete suggestions', { tag: ['@W01', '@search'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user navigates to the search page', null, { page }); 
    await When('the user types "rice"', null, { page }); 
    await Then('an autocomplete dropdown appears with matching products', null, { page }); 
    await And('each suggestion shows a thumbnail, title, and price', null, { page }); 
    await And('the dropdown shows a "View all results" link', null, { page }); 
  });

  test('Search shows autocomplete suggestions for vernacular terms', { tag: ['@W01', '@search'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user navigates to the search page', null, { page }); 
    await When('the user types "dal"', null, { page }); 
    await Then('the autocomplete dropdown shows lentil products matching the term', null, { page }); 
  });

  test('Clicking outside search closes autocomplete', { tag: ['@W01', '@search'] }, async ({ Given, When, Then, page }) => { 
    await Given('the search autocomplete dropdown is visible', null, { page }); 
    await When('the user clicks outside the search area', null, { page }); 
    await Then('the autocomplete dropdown closes', null, { page }); 
  });

  test('Empty search query shows guidance', { tag: ['@W01', '@search'] }, async ({ Given, Then, page }) => { 
    await Given('the user navigates to the search page with an empty query', null, { page }); 
    await Then('the page displays a message to start typing or select a category', null, { page }); 
  });

  test('No matching search results shows suggestion', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "xyznonexistent"', null, { page }); 
    await Then('the page displays no results', null, { page }); 
    await And('the page displays a suggestion to try different terms', null, { page }); 
  });

  test('Category quick-filter chip narrows results', { tag: ['@W01', '@search'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on the search page with results', null, { page }); 
    await When('the user clicks the "Rice" category chip', null, { page }); 
    await Then('only products in the Rice category are displayed', null, { page }); 
    await And('the "Rice" chip is visually active', null, { page }); 
  });

  test('Deselecting a category chip restores all results', { tag: ['@W01', '@search'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('a category chip is active on the search results', null, { page }); 
    await When('the user clicks the same chip again', null, { page }); 
    await Then('the filter is removed', null, { page }); 
    await And('all search results are displayed', null, { page }); 
  });

  test('Search results show product cards with prices', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "rice"', null, { page }); 
    await Then('each search result displays a product title', null, { page }); 
    await And('each search result displays a product price', null, { page }); 
    await And('each search result displays a product image', null, { page }); 
  });

  test('Top 10 search results are ranked correctly', { tag: ['@W01', '@search'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to the search page with query "masala"', null, { page }); 
    await Then('the top result is "Shan Karahi Gosht Masala"', null, { page }); 
    await And('the results include "MDH Kitchen King Masala"', null, { page }); 
    await And('at least 10 results are returned', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\catalog\\search.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":15,"tags":["@W01","@search"],"steps":[{"pwStepLine":7,"gherkinStepLine":16,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"basmati\"","stepMatchArguments":[{"group":{"start":49,"value":"\"basmati\"","children":[{"start":50,"value":"basmati","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":8,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"Then the page displays search results","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":18,"keywordType":"Outcome","textWithKeyword":"And the results include \"Tilda Pure Basmati\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Tilda Pure Basmati\"","children":[{"start":21,"value":"Tilda Pure Basmati","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":10,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"And the results include \"Natco - Basmati Rice India - Bag 5kg\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Natco - Basmati Rice India - Bag 5kg\"","children":[{"start":21,"value":"Natco - Basmati Rice India - Bag 5kg","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":13,"pickleLine":21,"tags":["@W01","@search"],"steps":[{"pwStepLine":14,"gherkinStepLine":22,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"jeera\"","stepMatchArguments":[{"group":{"start":49,"value":"\"jeera\"","children":[{"start":50,"value":"jeera","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then the page displays search results","stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"And the results include \"TRS Cumin Seeds\"","stepMatchArguments":[{"group":{"start":20,"value":"\"TRS Cumin Seeds\"","children":[{"start":21,"value":"TRS Cumin Seeds","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And the results include \"Natco - Cumin Seeds 400g\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Natco - Cumin Seeds 400g\"","children":[{"start":21,"value":"Natco - Cumin Seeds 400g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":20,"pickleLine":27,"tags":["@W01","@search"],"steps":[{"pwStepLine":21,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"haldi\"","stepMatchArguments":[{"group":{"start":49,"value":"\"haldi\"","children":[{"start":50,"value":"haldi","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"Then the page displays search results","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"And the results include \"Natco - Turmeric Powder 400g\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Natco - Turmeric Powder 400g\"","children":[{"start":21,"value":"Natco - Turmeric Powder 400g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And the results include \"Natco - Turmeric Powder Jar 100g\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Natco - Turmeric Powder Jar 100g\"","children":[{"start":21,"value":"Natco - Turmeric Powder Jar 100g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":27,"pickleLine":33,"tags":["@W01","@search"],"steps":[{"pwStepLine":28,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"chana\"","stepMatchArguments":[{"group":{"start":49,"value":"\"chana\"","children":[{"start":50,"value":"chana","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the page displays search results","stepMatchArguments":[]},{"pwStepLine":30,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And the results include \"Natco - Chanadal Polished 2kg\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Natco - Chanadal Polished 2kg\"","children":[{"start":21,"value":"Natco - Chanadal Polished 2kg","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":31,"gherkinStepLine":37,"keywordType":"Outcome","textWithKeyword":"And the results include \"Natco - Brown Chick Peas 2kg\"","stepMatchArguments":[{"group":{"start":20,"value":"\"Natco - Brown Chick Peas 2kg\"","children":[{"start":21,"value":"Natco - Brown Chick Peas 2kg","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":34,"pickleLine":39,"tags":["@W01","@search"],"steps":[{"pwStepLine":35,"gherkinStepLine":40,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":41,"keywordType":"Action","textWithKeyword":"When the user types \"rice\"","stepMatchArguments":[{"group":{"start":15,"value":"\"rice\"","children":[{"start":16,"value":"rice","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":37,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"Then an autocomplete dropdown appears with matching products","stepMatchArguments":[]},{"pwStepLine":38,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"And each suggestion shows a thumbnail, title, and price","stepMatchArguments":[]},{"pwStepLine":39,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"And the dropdown shows a \"View all results\" link","stepMatchArguments":[{"group":{"start":21,"value":"\"View all results\"","children":[{"start":22,"value":"View all results","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":42,"pickleLine":46,"tags":["@W01","@search"],"steps":[{"pwStepLine":43,"gherkinStepLine":47,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":48,"keywordType":"Action","textWithKeyword":"When the user types \"dal\"","stepMatchArguments":[{"group":{"start":15,"value":"\"dal\"","children":[{"start":16,"value":"dal","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":45,"gherkinStepLine":49,"keywordType":"Outcome","textWithKeyword":"Then the autocomplete dropdown shows lentil products matching the term","stepMatchArguments":[]}]},
  {"pwTestLine":48,"pickleLine":51,"tags":["@W01","@search"],"steps":[{"pwStepLine":49,"gherkinStepLine":52,"keywordType":"Context","textWithKeyword":"Given the search autocomplete dropdown is visible","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":53,"keywordType":"Action","textWithKeyword":"When the user clicks outside the search area","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":54,"keywordType":"Outcome","textWithKeyword":"Then the autocomplete dropdown closes","stepMatchArguments":[]}]},
  {"pwTestLine":54,"pickleLine":56,"tags":["@W01","@search"],"steps":[{"pwStepLine":55,"gherkinStepLine":57,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with an empty query","stepMatchArguments":[]},{"pwStepLine":56,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then the page displays a message to start typing or select a category","stepMatchArguments":[]}]},
  {"pwTestLine":59,"pickleLine":60,"tags":["@W01","@search"],"steps":[{"pwStepLine":60,"gherkinStepLine":61,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"xyznonexistent\"","stepMatchArguments":[{"group":{"start":49,"value":"\"xyznonexistent\"","children":[{"start":50,"value":"xyznonexistent","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":61,"gherkinStepLine":62,"keywordType":"Outcome","textWithKeyword":"Then the page displays no results","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":63,"keywordType":"Outcome","textWithKeyword":"And the page displays a suggestion to try different terms","stepMatchArguments":[]}]},
  {"pwTestLine":65,"pickleLine":65,"tags":["@W01","@search"],"steps":[{"pwStepLine":66,"gherkinStepLine":66,"keywordType":"Context","textWithKeyword":"Given the user is on the search page with results","stepMatchArguments":[]},{"pwStepLine":67,"gherkinStepLine":67,"keywordType":"Action","textWithKeyword":"When the user clicks the \"Rice\" category chip","stepMatchArguments":[{"group":{"start":20,"value":"\"Rice\"","children":[{"start":21,"value":"Rice","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":68,"gherkinStepLine":68,"keywordType":"Outcome","textWithKeyword":"Then only products in the Rice category are displayed","stepMatchArguments":[]},{"pwStepLine":69,"gherkinStepLine":69,"keywordType":"Outcome","textWithKeyword":"And the \"Rice\" chip is visually active","stepMatchArguments":[{"group":{"start":4,"value":"\"Rice\"","children":[{"start":5,"value":"Rice","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":72,"pickleLine":71,"tags":["@W01","@search"],"steps":[{"pwStepLine":73,"gherkinStepLine":72,"keywordType":"Context","textWithKeyword":"Given a category chip is active on the search results","stepMatchArguments":[]},{"pwStepLine":74,"gherkinStepLine":73,"keywordType":"Action","textWithKeyword":"When the user clicks the same chip again","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":74,"keywordType":"Outcome","textWithKeyword":"Then the filter is removed","stepMatchArguments":[]},{"pwStepLine":76,"gherkinStepLine":75,"keywordType":"Outcome","textWithKeyword":"And all search results are displayed","stepMatchArguments":[]}]},
  {"pwTestLine":79,"pickleLine":77,"tags":["@W01","@search"],"steps":[{"pwStepLine":80,"gherkinStepLine":78,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"rice\"","stepMatchArguments":[{"group":{"start":49,"value":"\"rice\"","children":[{"start":50,"value":"rice","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":81,"gherkinStepLine":79,"keywordType":"Outcome","textWithKeyword":"Then each search result displays a product title","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":80,"keywordType":"Outcome","textWithKeyword":"And each search result displays a product price","stepMatchArguments":[]},{"pwStepLine":83,"gherkinStepLine":81,"keywordType":"Outcome","textWithKeyword":"And each search result displays a product image","stepMatchArguments":[]}]},
  {"pwTestLine":86,"pickleLine":83,"tags":["@W01","@search"],"steps":[{"pwStepLine":87,"gherkinStepLine":84,"keywordType":"Context","textWithKeyword":"Given the user navigates to the search page with query \"masala\"","stepMatchArguments":[{"group":{"start":49,"value":"\"masala\"","children":[{"start":50,"value":"masala","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":88,"gherkinStepLine":85,"keywordType":"Outcome","textWithKeyword":"Then the top result is \"Shan Karahi Gosht Masala\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Shan Karahi Gosht Masala\"","children":[{"start":19,"value":"Shan Karahi Gosht Masala","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":89,"gherkinStepLine":86,"keywordType":"Outcome","textWithKeyword":"And the results include \"MDH Kitchen King Masala\"","stepMatchArguments":[{"group":{"start":20,"value":"\"MDH Kitchen King Masala\"","children":[{"start":21,"value":"MDH Kitchen King Masala","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":90,"gherkinStepLine":87,"keywordType":"Outcome","textWithKeyword":"And at least 10 results are returned","stepMatchArguments":[{"group":{"start":9,"value":"10"},"parameterTypeName":"int"}]}]},
]; // bdd-data-end