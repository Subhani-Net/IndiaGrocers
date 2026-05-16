import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["gb"];

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Default Sales Channel",
          description: "Created by Medusa",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Default Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  const {
    result: [store],
  } = await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "IndiaGrocers London",
          supported_currencies: [
            {
              currency_code: "gbp",
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "UK",
          currency_code: "gbp",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "London Warehouse",
          address: {
            city: "London",
            country_code: "GB",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "London Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "UK Mainland",
        geo_zones: [
          {
            country_code: "gb",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Delivered in 3-5 working days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "gbp",
            amount: 399,
          },
          {
            region_id: region.id,
            amount: 399,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Delivered next working day.",
          code: "express",
        },
        prices: [
          {
            currency_code: "gbp",
            amount: 699,
          },
          {
            region_id: region.id,
            amount: 699,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product categories...");

  const parents = [
    "Rice & Grains", "Dals & Lentils", "Spices & Masalas",
    "Cooking Oils & Ghee", "Flours & Grains", "Snacks & Namkeen",
    "Beverages", "Pickles & Chutneys", "Papads & Fryums",
    "Frozen Foods", "Sweets & Mithai", "Noodles & Pasta",
    "Sauces & Ketchup", "Dairy & Milk Products", "Ready to Eat",
    "Fresh Vegetables",
  ];

  const children: Record<string, string[]> = {
    "Rice & Grains": ["Basmati Rice", "Sona Masoori", "Ponni Boiled", "Idli Rice"],
    "Dals & Lentils": ["Toor Dal", "Moong Dal", "Masoor Dal", "Chana Dal", "Urad Dal", "Kabuli Chana"],
    "Spices & Masalas": ["Turmeric", "Chilli Powder", "Cumin", "Coriander", "Garam Masala", "Chicken Masala", "Whole Spices"],
    "Cooking Oils & Ghee": ["Mustard Oil", "Sunflower Oil", "Ghee", "Coconut Oil", "Groundnut Oil"],
    "Flours & Grains": ["Wheat Atta", "Besan", "Rice Flour", "Sooji", "Maida"],
    "Snacks & Namkeen": ["Bhujia", "Namkeen", "Chips", "Biscuits"],
    "Beverages": ["Tea", "Coffee", "Drinks"],
    "Pickles & Chutneys": ["Mango Pickle", "Lime Pickle", "Mixed Pickle", "Chutneys"],
    "Papads & Fryums": [],
    "Frozen Foods": ["Frozen Snacks", "Frozen Paratha"],
    "Sweets & Mithai": ["Laddu", "Barfi", "Canned Sweets"],
    "Noodles & Pasta": ["Instant Noodles", "Pasta"],
    "Sauces & Ketchup": [],
    "Dairy & Milk Products": [],
    "Ready to Eat": ["Curry Pouches", "Breakfast Mixes"],
    "Fresh Vegetables": ["Onions", "Potatoes", "Tomatoes"],
  };

  const { result: parentResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: parents.map((name) => ({
        name,
        is_active: true,
      })),
    },
  });

  const parentMap = new Map<string, string>();
  for (const cat of parentResult) {
    parentMap.set(cat.name, cat.id);
  }

  const childCategories: { name: string; parent_category_id: string; is_active: boolean }[] = [];
  for (const [parentName, childNames] of Object.entries(children)) {
    const parentId = parentMap.get(parentName);
    if (parentId) {
      for (const childName of childNames) {
        childCategories.push({
          name: childName,
          parent_category_id: parentId,
          is_active: true,
        });
      }
    }
  }

  const { result: childResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: childCategories,
    },
  });

  const catMap = new Map<string, string>();
  for (const cat of parentResult) {
    catMap.set(cat.name, cat.id);
  }
  for (const cat of childResult) {
    catMap.set(cat.name, cat.id);
  }

  const allCategories = { data: [...parentResult, ...childResult] };

  logger.info("Seeding product data...");

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Basmati Rice - India Gate",
          category_ids: [catMap.get("Basmati Rice")!],
          description: "Premium long grain basmati rice by India Gate.",
          handle: "basmati-rice-india-gate",
          weight: 1000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Weight",
              values: ["1kg", "5kg"],
            },
          ],
          variants: [
            {
              title: "1kg",
              sku: "RICE-BASMATI-IG-1KG",
              options: { Weight: "1kg" },
              prices: [{ amount: 549, currency_code: "gbp" }],
            },
            {
              title: "5kg",
              sku: "RICE-BASMATI-IG-5KG",
              options: { Weight: "5kg" },
              prices: [{ amount: 2599, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Basmati Rice - Daawat",
          category_ids: [catMap.get("Basmati Rice")!],
          description: "Premium long grain basmati rice by Daawat.",
          handle: "basmati-rice-daawat",
          weight: 1000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Weight",
              values: ["1kg", "5kg", "10kg"],
            },
          ],
          variants: [
            {
              title: "1kg",
              sku: "RICE-BASMATI-DT-1KG",
              options: { Weight: "1kg" },
              prices: [{ amount: 529, currency_code: "gbp" }],
            },
            {
              title: "5kg",
              sku: "RICE-BASMATI-DT-5KG",
              options: { Weight: "5kg" },
              prices: [{ amount: 2499, currency_code: "gbp" }],
            },
            {
              title: "10kg",
              sku: "RICE-BASMATI-DT-10KG",
              options: { Weight: "10kg" },
              prices: [{ amount: 4799, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Toor Dal - Deepak",
          category_ids: [catMap.get("Toor Dal")!],
          description: "Premium quality toor dal by Deepak.",
          handle: "toor-dal-deepak",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Weight",
              values: ["500g", "1kg", "2kg"],
            },
          ],
          variants: [
            {
              title: "500g",
              sku: "DAL-TOOR-DEEPAK-500G",
              options: { Weight: "500g" },
              prices: [{ amount: 199, currency_code: "gbp" }],
            },
            {
              title: "1kg",
              sku: "DAL-TOOR-DEEPAK-1KG",
              options: { Weight: "1kg" },
              prices: [{ amount: 379, currency_code: "gbp" }],
            },
            {
              title: "2kg",
              sku: "DAL-TOOR-DEEPAK-2KG",
              options: { Weight: "2kg" },
              prices: [{ amount: 729, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Toor Dal - Tata Sampann",
          category_ids: [catMap.get("Toor Dal")!],
          description: "Unpolished toor dal by Tata Sampann.",
          handle: "toor-dal-tata",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Weight",
              values: ["500g", "1kg"],
            },
          ],
          variants: [
            {
              title: "500g",
              sku: "DAL-TOOR-TATA-500G",
              options: { Weight: "500g" },
              prices: [{ amount: 219, currency_code: "gbp" }],
            },
            {
              title: "1kg",
              sku: "DAL-TOOR-TATA-1KG",
              options: { Weight: "1kg" },
              prices: [{ amount: 399, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Toor Dal - Laxmi",
          category_ids: [catMap.get("Toor Dal")!],
          description: "Everyday toor dal by Laxmi.",
          handle: "toor-dal-laxmi",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Weight",
              values: ["500g", "1kg", "2kg"],
            },
          ],
          variants: [
            {
              title: "500g",
              sku: "DAL-TOOR-LAXMI-500G",
              options: { Weight: "500g" },
              prices: [{ amount: 179, currency_code: "gbp" }],
            },
            {
              title: "1kg",
              sku: "DAL-TOOR-LAXMI-1KG",
              options: { Weight: "1kg" },
              prices: [{ amount: 339, currency_code: "gbp" }],
            },
            {
              title: "2kg",
              sku: "DAL-TOOR-LAXMI-2KG",
              options: { Weight: "2kg" },
              prices: [{ amount: 649, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Fresh Red Onions - Loose",
          category_ids: [catMap.get("Onions")!],
          description: "Fresh red onions sold by weight.",
          handle: "fresh-red-onions",
          weight: 1000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Packaging",
              values: ["Loose 1kg", "Bag 5kg"],
            },
          ],
          variants: [
            {
              title: "Loose 1kg",
              sku: "ONION-LOOSE-1KG",
              options: { Packaging: "Loose 1kg" },
              prices: [{ amount: 129, currency_code: "gbp" }],
            },
            {
              title: "Bag 5kg",
              sku: "ONION-BAG-5KG",
              options: { Packaging: "Bag 5kg" },
              prices: [{ amount: 549, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Fresh Potatoes - Loose",
          category_ids: [catMap.get("Potatoes")!],
          description: "Fresh white potatoes sold by weight.",
          handle: "fresh-potatoes",
          weight: 1000,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          options: [
            {
              title: "Packaging",
              values: ["Loose 1kg", "Bag 5kg"],
            },
          ],
          variants: [
            {
              title: "Loose 1kg",
              sku: "POTATO-LOOSE-1KG",
              options: { Packaging: "Loose 1kg" },
              prices: [{ amount: 99, currency_code: "gbp" }],
            },
            {
              title: "Bag 5kg",
              sku: "POTATO-BAG-5KG",
              options: { Packaging: "Bag 5kg" },
              prices: [{ amount: 429, currency_code: "gbp" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000000,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Finished seeding inventory levels data.");

  logger.info("");
  logger.info("============================================================");
  logger.info("  IndiaGrocers London - Seed Complete!");
  logger.info("============================================================");
  logger.info(`  Store:   ${store.name}`);
  logger.info(`  Region:  ${region.name} (GBP)`);
  logger.info(`  Warehouse: ${stockLocation.name}`);
  logger.info("  Categories & Subcategories:");
  for (const cat of allCategories.data) {
    if (!cat.parent_category_id) {
      logger.info(`    ${cat.name} (${cat.id})`);
      for (const child of allCategories.data) {
        if (child.parent_category_id === cat.id) {
          logger.info(`      ${child.name} (${child.id})`);
        }
      }
    }
  }
  logger.info("============================================================");
  logger.info("  Use subcategory IDs in your CSV's");
  logger.info("  'Product Category 1' column.");
  logger.info("============================================================");
}
