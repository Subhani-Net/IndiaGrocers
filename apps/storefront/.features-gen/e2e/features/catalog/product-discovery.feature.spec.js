// Generated from: e2e\features\catalog\product-discovery.feature
import { test } from "playwright-bdd";

test.describe('Product Discovery — Browse, Categories, PDP', () => {

  test('Browse a category from the homepage grid', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on the homepage', null, { page }); 
    await When('the user clicks a category card in the category grid', null, { page }); 
    await Then('the user is navigated to a category page', null, { page }); 
    await And('the page displays breadcrumb navigation', null, { page }); 
    await And('the page displays the category title', null, { page }); 
    await And('the page displays subcategory chips', null, { page }); 
    await And('the page displays a grid of product cards', null, { page }); 
  });

  test('Browse a subcategory from the chips', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a parent category page', null, { page }); 
    await When('the user clicks a subcategory chip', null, { page }); 
    await Then('only products from that subcategory are displayed', null, { page }); 
    await And('the subcategory chip is visually active', null, { page }); 
  });

  test('Category page with no products shows an empty state', { tag: ['@W01', '@catalog'] }, async ({ Given, Then, And, page }) => { 
    await Given('the user navigates to an empty category', null, { page }); 
    await Then('the page displays a "no products found" message', null, { page }); 
    await And('the page displays breadcrumb navigation', null, { page }); 
  });

  test('View a product detail page for a single-variant product', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a category page', null, { page }); 
    await When('the user clicks the product card for "Natco - Cumin Seeds 400g"', null, { page }); 
    await Then('the user is navigated to the product detail page', null, { page }); 
    await And('the page displays the product title "Natco - Cumin Seeds 400g"', null, { page }); 
    await And('the page displays at least one product image', null, { page }); 
    await And('the page displays the product price', null, { page }); 
    await And('the page displays an "Add to Cart" button', null, { page }); 
    await And('the page displays a stock status indicator', null, { page }); 
  });

  test('View a product detail page for a multi-variant product', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a category page', null, { page }); 
    await When('the user clicks the product card for "Tilda Pure Basmati"', null, { page }); 
    await Then('the user is navigated to the product detail page', null, { page }); 
    await And('the page displays variant size options', null, { page }); 
    await And('the price updates when a different variant is selected', null, { page }); 
  });

  test('Product detail page shows grocery-specific information', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a product detail page', null, { page }); 
    await When('the user expands the product information section', null, { page }); 
    await Then('the page displays ingredient information if available', null, { page }); 
    await And('the page displays storage instructions if available', null, { page }); 
    await And('the page displays allergen information if available', null, { page }); 
    await And('the page does not display clothing-specific fields', null, { page }); 
  });

  test('Open the variant overlay from a product card', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on a category page with multi-variant products', null, { page }); 
    await When('the user clicks the Options button on a product card', null, { page }); 
    await Then('a modal overlay opens showing all variants', null, { page }); 
    await And('each variant shows a quantity control', null, { page }); 
    await And('pressing ESC closes the overlay', null, { page }); 
    await And('clicking outside the overlay closes it', null, { page }); 
  });

  test('Sort products by price on a listing page', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the store page', null, { page }); 
    await When('the user selects "Price: Low to High" from the sort dropdown', null, { page }); 
    await Then('products are displayed in ascending price order', null, { page }); 
  });

  test('Filter products by price range', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, page }) => { 
    await Given('the user is on the store page', null, { page }); 
    await When('the user enters a minimum price and a maximum price', null, { page }); 
    await Then('only products within the price range are displayed', null, { page }); 
  });

  test('Clear all active filters', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user has applied filters', null, { page }); 
    await When('the user clicks "Clear Filters"', null, { page }); 
    await Then('all filters are removed', null, { page }); 
    await And('all products are displayed', null, { page }); 
  });

  test('Load more products via pagination', { tag: ['@W01', '@catalog'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('the user is on the store page', null, { page }); 
    await When('the user clicks "Load More"', null, { page }); 
    await Then('additional products are appended to the grid', null, { page }); 
    await And('the product count display updates', null, { page }); 
  });

  test('Product card displays brand badge', { tag: ['@W01', '@catalog'] }, async ({ Given, Then, page }) => { 
    await Given('the user is on a category page', null, { page }); 
    await Then('each product card displays a brand badge', null, { page }); 
  });

  test('Product with no image shows a placeholder', { tag: ['@W01', '@catalog'] }, async ({ Given, Then, page }) => { 
    await Given('the user views a product with a missing image', null, { page }); 
    await Then('a placeholder image is displayed instead of a broken image', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('e2e\\features\\catalog\\product-discovery.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":6,"pickleLine":18,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":7,"gherkinStepLine":19,"keywordType":"Context","textWithKeyword":"Given the user is on the homepage","stepMatchArguments":[]},{"pwStepLine":8,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When the user clicks a category card in the category grid","stepMatchArguments":[]},{"pwStepLine":9,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to a category page","stepMatchArguments":[]},{"pwStepLine":10,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"And the page displays breadcrumb navigation","stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"And the page displays the category title","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"And the page displays subcategory chips","stepMatchArguments":[]},{"pwStepLine":13,"gherkinStepLine":25,"keywordType":"Outcome","textWithKeyword":"And the page displays a grid of product cards","stepMatchArguments":[]}]},
  {"pwTestLine":16,"pickleLine":27,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":17,"gherkinStepLine":28,"keywordType":"Context","textWithKeyword":"Given the user is on a parent category page","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":29,"keywordType":"Action","textWithKeyword":"When the user clicks a subcategory chip","stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":30,"keywordType":"Outcome","textWithKeyword":"Then only products from that subcategory are displayed","stepMatchArguments":[]},{"pwStepLine":20,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"And the subcategory chip is visually active","stepMatchArguments":[]}]},
  {"pwTestLine":23,"pickleLine":33,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":24,"gherkinStepLine":34,"keywordType":"Context","textWithKeyword":"Given the user navigates to an empty category","stepMatchArguments":[]},{"pwStepLine":25,"gherkinStepLine":35,"keywordType":"Outcome","textWithKeyword":"Then the page displays a \"no products found\" message","stepMatchArguments":[{"group":{"start":20,"value":"\"no products found\"","children":[{"start":21,"value":"no products found","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":26,"gherkinStepLine":36,"keywordType":"Outcome","textWithKeyword":"And the page displays breadcrumb navigation","stepMatchArguments":[]}]},
  {"pwTestLine":29,"pickleLine":38,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":30,"gherkinStepLine":39,"keywordType":"Context","textWithKeyword":"Given the user is on a category page","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":40,"keywordType":"Action","textWithKeyword":"When the user clicks the product card for \"Natco - Cumin Seeds 400g\"","stepMatchArguments":[{"group":{"start":37,"value":"\"Natco - Cumin Seeds 400g\"","children":[{"start":38,"value":"Natco - Cumin Seeds 400g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":41,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to the product detail page","stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":42,"keywordType":"Outcome","textWithKeyword":"And the page displays the product title \"Natco - Cumin Seeds 400g\"","stepMatchArguments":[{"group":{"start":36,"value":"\"Natco - Cumin Seeds 400g\"","children":[{"start":37,"value":"Natco - Cumin Seeds 400g","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":34,"gherkinStepLine":43,"keywordType":"Outcome","textWithKeyword":"And the page displays at least one product image","stepMatchArguments":[]},{"pwStepLine":35,"gherkinStepLine":44,"keywordType":"Outcome","textWithKeyword":"And the page displays the product price","stepMatchArguments":[]},{"pwStepLine":36,"gherkinStepLine":45,"keywordType":"Outcome","textWithKeyword":"And the page displays an \"Add to Cart\" button","stepMatchArguments":[{"group":{"start":21,"value":"\"Add to Cart\"","children":[{"start":22,"value":"Add to Cart","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":37,"gherkinStepLine":46,"keywordType":"Outcome","textWithKeyword":"And the page displays a stock status indicator","stepMatchArguments":[]}]},
  {"pwTestLine":40,"pickleLine":48,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":41,"gherkinStepLine":49,"keywordType":"Context","textWithKeyword":"Given the user is on a category page","stepMatchArguments":[]},{"pwStepLine":42,"gherkinStepLine":50,"keywordType":"Action","textWithKeyword":"When the user clicks the product card for \"Tilda Pure Basmati\"","stepMatchArguments":[{"group":{"start":37,"value":"\"Tilda Pure Basmati\"","children":[{"start":38,"value":"Tilda Pure Basmati","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":43,"gherkinStepLine":51,"keywordType":"Outcome","textWithKeyword":"Then the user is navigated to the product detail page","stepMatchArguments":[]},{"pwStepLine":44,"gherkinStepLine":52,"keywordType":"Outcome","textWithKeyword":"And the page displays variant size options","stepMatchArguments":[]},{"pwStepLine":45,"gherkinStepLine":53,"keywordType":"Outcome","textWithKeyword":"And the price updates when a different variant is selected","stepMatchArguments":[]}]},
  {"pwTestLine":48,"pickleLine":55,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":49,"gherkinStepLine":56,"keywordType":"Context","textWithKeyword":"Given the user is on a product detail page","stepMatchArguments":[]},{"pwStepLine":50,"gherkinStepLine":57,"keywordType":"Action","textWithKeyword":"When the user expands the product information section","stepMatchArguments":[]},{"pwStepLine":51,"gherkinStepLine":58,"keywordType":"Outcome","textWithKeyword":"Then the page displays ingredient information if available","stepMatchArguments":[]},{"pwStepLine":52,"gherkinStepLine":59,"keywordType":"Outcome","textWithKeyword":"And the page displays storage instructions if available","stepMatchArguments":[]},{"pwStepLine":53,"gherkinStepLine":60,"keywordType":"Outcome","textWithKeyword":"And the page displays allergen information if available","stepMatchArguments":[]},{"pwStepLine":54,"gherkinStepLine":61,"keywordType":"Outcome","textWithKeyword":"And the page does not display clothing-specific fields","stepMatchArguments":[]}]},
  {"pwTestLine":57,"pickleLine":63,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":58,"gherkinStepLine":64,"keywordType":"Context","textWithKeyword":"Given the user is on a category page with multi-variant products","stepMatchArguments":[]},{"pwStepLine":59,"gherkinStepLine":65,"keywordType":"Action","textWithKeyword":"When the user clicks the Options button on a product card","stepMatchArguments":[]},{"pwStepLine":60,"gherkinStepLine":66,"keywordType":"Outcome","textWithKeyword":"Then a modal overlay opens showing all variants","stepMatchArguments":[]},{"pwStepLine":61,"gherkinStepLine":67,"keywordType":"Outcome","textWithKeyword":"And each variant shows a quantity control","stepMatchArguments":[]},{"pwStepLine":62,"gherkinStepLine":68,"keywordType":"Outcome","textWithKeyword":"And pressing ESC closes the overlay","stepMatchArguments":[]},{"pwStepLine":63,"gherkinStepLine":69,"keywordType":"Outcome","textWithKeyword":"And clicking outside the overlay closes it","stepMatchArguments":[]}]},
  {"pwTestLine":66,"pickleLine":71,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":67,"gherkinStepLine":72,"keywordType":"Context","textWithKeyword":"Given the user is on the store page","stepMatchArguments":[]},{"pwStepLine":68,"gherkinStepLine":73,"keywordType":"Action","textWithKeyword":"When the user selects \"Price: Low to High\" from the sort dropdown","stepMatchArguments":[{"group":{"start":17,"value":"\"Price: Low to High\"","children":[{"start":18,"value":"Price: Low to High","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":69,"gherkinStepLine":74,"keywordType":"Outcome","textWithKeyword":"Then products are displayed in ascending price order","stepMatchArguments":[]}]},
  {"pwTestLine":72,"pickleLine":76,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":73,"gherkinStepLine":77,"keywordType":"Context","textWithKeyword":"Given the user is on the store page","stepMatchArguments":[]},{"pwStepLine":74,"gherkinStepLine":78,"keywordType":"Action","textWithKeyword":"When the user enters a minimum price and a maximum price","stepMatchArguments":[]},{"pwStepLine":75,"gherkinStepLine":79,"keywordType":"Outcome","textWithKeyword":"Then only products within the price range are displayed","stepMatchArguments":[]}]},
  {"pwTestLine":78,"pickleLine":81,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":79,"gherkinStepLine":82,"keywordType":"Context","textWithKeyword":"Given the user has applied filters","stepMatchArguments":[]},{"pwStepLine":80,"gherkinStepLine":83,"keywordType":"Action","textWithKeyword":"When the user clicks \"Clear Filters\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Clear Filters\"","children":[{"start":17,"value":"Clear Filters","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":81,"gherkinStepLine":84,"keywordType":"Outcome","textWithKeyword":"Then all filters are removed","stepMatchArguments":[]},{"pwStepLine":82,"gherkinStepLine":85,"keywordType":"Outcome","textWithKeyword":"And all products are displayed","stepMatchArguments":[]}]},
  {"pwTestLine":85,"pickleLine":87,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":86,"gherkinStepLine":88,"keywordType":"Context","textWithKeyword":"Given the user is on the store page","stepMatchArguments":[]},{"pwStepLine":87,"gherkinStepLine":89,"keywordType":"Action","textWithKeyword":"When the user clicks \"Load More\"","stepMatchArguments":[{"group":{"start":16,"value":"\"Load More\"","children":[{"start":17,"value":"Load More","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":88,"gherkinStepLine":90,"keywordType":"Outcome","textWithKeyword":"Then additional products are appended to the grid","stepMatchArguments":[]},{"pwStepLine":89,"gherkinStepLine":91,"keywordType":"Outcome","textWithKeyword":"And the product count display updates","stepMatchArguments":[]}]},
  {"pwTestLine":92,"pickleLine":93,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":93,"gherkinStepLine":94,"keywordType":"Context","textWithKeyword":"Given the user is on a category page","stepMatchArguments":[]},{"pwStepLine":94,"gherkinStepLine":95,"keywordType":"Outcome","textWithKeyword":"Then each product card displays a brand badge","stepMatchArguments":[]}]},
  {"pwTestLine":97,"pickleLine":97,"tags":["@W01","@catalog"],"steps":[{"pwStepLine":98,"gherkinStepLine":98,"keywordType":"Context","textWithKeyword":"Given the user views a product with a missing image","stepMatchArguments":[]},{"pwStepLine":99,"gherkinStepLine":99,"keywordType":"Outcome","textWithKeyword":"Then a placeholder image is displayed instead of a broken image","stepMatchArguments":[]}]},
]; // bdd-data-end