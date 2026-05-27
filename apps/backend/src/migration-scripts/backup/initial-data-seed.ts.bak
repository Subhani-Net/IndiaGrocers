import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
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
        metadata: { nav_visible: true },
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

  const allCategories = { data: [...parentResult, ...childResult] };

  logger.info("Skipping hardcoded product seeding — products are imported via Natco CSV catalog.");

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

  logger.info("Seeding product collections...");
  const { result: collectionResults } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        { title: "Best Sellers", handle: "best-sellers", metadata: { description: "Top-selling Indian groceries" } },
        { title: "Rice & Grains", handle: "rice-grains", metadata: { description: "Basmati, Sona Masoori, and more" } },
        { title: "Spices & Masalas", handle: "spices-masalas", metadata: { description: "Whole and ground Indian spices" } },
        { title: "Dals & Lentils", handle: "dals-lentils", metadata: { description: "Toor, moong, masoor, and chana dals" } },
        { title: "Snacks & Namkeen", handle: "snacks-namkeen", metadata: { description: "Bhujia, chips, biscuits, and namkeen" } },
        { title: "Cooking Oils & Ghee", handle: "cooking-oils-ghee", metadata: { description: "Mustard, sunflower, coconut oils and pure ghee" } },
        { title: "Beverages", handle: "beverages", metadata: { description: "Tea, coffee, and Indian drinks" } },
        { title: "Frozen Foods", handle: "frozen-foods", metadata: { description: "Frozen snacks, parathas, and vegetables" } },
        { title: "Pooja Essentials", handle: "pooja-essentials", metadata: { description: "Everything for your home temple and rituals" } },
        { title: "Sweets & Mithai", handle: "sweets-mithai", metadata: { description: "Laddus, barfis, and canned Indian sweets" } },
        { title: "Pickles & Chutneys", handle: "pickles-chutneys", metadata: { description: "Mango, lime, mixed pickles and chutneys" } },
        { title: "Fresh Vegetables", handle: "fresh-vegetables", metadata: { description: "Fresh onions, potatoes, tomatoes, and seasonal veg" } },
      ],
    },
  });
  logger.info(`Created ${collectionResults.length} product collections.`);

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
