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

  logger.info("Seeding product categories (design master list)...");

  // === DESIGN-MATCHED CATEGORIES (from catalogue-build/01-categories-master-list.md) ===
  //
  // Each parent has: name, handle (explicit URL slug), phase, template, status
  // Phase 1 categories: live immediately
  // Phase 2/3 categories: coming-soon — show waitlist on storefront

  interface CategoryDef {
    name: string
    handle: string
    is_active: boolean
    metadata: {
      nav_visible: boolean
      phase: 1 | 2 | 3
      template: string
      status: "live" | "coming-soon"
    }
  }

  const parents: CategoryDef[] = [
    // === PHASE 1 — Launch (11 categories) ===
    { name: "Staples & Grains",  handle: "staples-grains",  is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-weight-heavy",     status: "live" } },
    { name: "Atta & Flours",    handle: "atta-flours",    is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-weight-heavy",     status: "live" } },
    { name: "Dal & Lentils",    handle: "dal-lentils",    is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-weight-heavy",     status: "live" } },
    { name: "Oils & Ghee",      handle: "oils-ghee",      is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-weight-heavy",     status: "live" } },
    { name: "Spices — Whole",   handle: "spices-whole",   is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-standard-grid",    status: "live" } },
    { name: "Spices — Ground",  handle: "spices-ground",  is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-standard-grid",    status: "live" } },
    { name: "Spice Blends",     handle: "spice-blends",   is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-brand-showcase",   status: "live" } },
    { name: "Dairy & Eggs",     handle: "dairy",          is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-standard-grid",    status: "live" } },
    { name: "Beverages",        handle: "beverages",      is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-brand-showcase",   status: "live" } },
    { name: "Snacks & Namkeen",  handle: "snacks-namkeen",  is_active: true,  metadata: { nav_visible: true, phase: 1, template: "template-standard-grid",    status: "live" } },
    { name: "Pickles & Chutneys", handle: "pickles-chutneys", is_active: true, metadata: { nav_visible: true, phase: 1, template: "template-standard-grid",  status: "live" } },

    // === PHASE 2 — Month 3+ (4 categories) ===
    { name: "Frozen Foods",                   handle: "frozen",          is_active: true, metadata: { nav_visible: true, phase: 2, template: "template-standard-grid",  status: "coming-soon" } },
    { name: "Fresh Produce",                  handle: "fresh",           is_active: true, metadata: { nav_visible: true, phase: 2, template: "template-fresh-produce", status: "coming-soon" } },
    { name: "Ready-to-Cook & Instant Mixes",  handle: "ready-to-cook",  is_active: true, metadata: { nav_visible: true, phase: 2, template: "template-standard-grid",  status: "coming-soon" } },
    { name: "Condiments & Cooking Essentials", handle: "condiments",     is_active: true, metadata: { nav_visible: true, phase: 2, template: "template-standard-grid",  status: "coming-soon" } },

    // === PHASE 3 — Month 9+ (3 categories) ===
    { name: "Pooja Essentials",         handle: "pooja",      is_active: true, metadata: { nav_visible: true, phase: 3, template: "template-standard-grid",    status: "coming-soon" } },
    { name: "Household & Kitchen",      handle: "household",  is_active: true, metadata: { nav_visible: true, phase: 3, template: "template-standard-grid",    status: "coming-soon" } },
    { name: "Regional Specialties",     handle: "regional",   is_active: true, metadata: { nav_visible: true, phase: 3, template: "template-regional-curated", status: "coming-soon" } },
  ];

  // Phase 1 granular sub-categories per design master list
  const children: Record<string, string[]> = {
    "Staples & Grains": [
      "Basmati Rice", "Sona Masoori Rice", "Idli Rice", "Brown Rice",
      "Poha (Flattened Rice)", "Semolina / Sooji / Rava",
    ],
    "Atta & Flours": [
      "Chapatti Flour (Atta)", "Besan (Gram Flour)", "Plain Flour (Maida)",
      "Rice Flour", "Ragi / Finger Millet Flour", "Suji / Coarse Semolina",
    ],
    "Dal & Lentils": [
      "Toor Dal", "Chana Dal", "Moong Dal (Yellow)", "Whole Moong (Green)",
      "Masoor Dal (Red Lentils)", "Urad Dal (Split)", "Whole Urad (Black)",
      "Rajma (Kidney Beans)", "Chana (Whole Chickpeas)", "Kala Chana (Black Chickpeas)",
      "Lobhia (Black Eye Beans)",
    ],
    "Oils & Ghee": [
      "Sunflower Oil", "Mustard Oil", "Vegetable / Refined Oil", "Coconut Oil",
      "Groundnut / Peanut Oil", "Ghee (Clarified Butter)",
    ],
    "Spices — Whole": [
      "Cumin Seeds (Jeera)", "Mustard Seeds (Rai)", "Coriander Seeds (Dhania)",
      "Fenugreek Seeds (Methi)", "Fennel Seeds (Saunf)", "Carom Seeds (Ajwain)",
      "Bay Leaves (Tej Patta)", "Green Cardamom (Elaichi)", "Black Cardamom",
      "Cloves (Laung)", "Cinnamon Sticks (Dalchini)", "Black Pepper (Kali Mirch)",
      "Asafoetida / Hing", "Dried Red Chillies", "Star Anise",
      "Panch Phoron", "Nutmeg (Jaiphal)",
    ],
    "Spices — Ground": [
      "Turmeric Powder (Haldi)", "Red Chilli Powder (Mirchi)", "Coriander Powder (Dhania)",
      "Cumin Powder (Jeera)", "Black Pepper Powder", "Ginger Powder (Sonth)",
      "Kashmiri Chilli Powder", "Amchur (Mango Powder)", "Kasuri Methi (Dried Fenugreek Leaves)",
    ],
    "Spice Blends": [
      "Garam Masala", "Chaat Masala", "Chole / Chana Masala", "Rajma Masala",
      "Biryani Masala", "Sambar Powder", "Rasam Powder", "Pav Bhaji Masala",
      "Kitchen King Masala", "Tandoori Masala", "Meat Masala", "Fish Curry Masala",
      "Chicken Masala", "Paneer Masala", "Pulao Masala",
    ],
    "Dairy & Eggs": [
      "Paneer", "Set Yoghurt / Dahi", "Butter (Salted)", "Butter (Unsalted)",
      "Double Cream", "Single Cream", "Condensed Milk", "Evaporated Milk",
    ],
    "Beverages": [
      "Loose Leaf Tea / Chai", "Tea Bags", "Filter Coffee", "Instant Coffee",
      "Horlicks", "Bournvita", "Rooh Afza / Rose Syrup", "Sherbets & Squash",
    ],
    "Snacks & Namkeen": [
      "Bhujia", "Mixture (Bombay Mix)", "Sev", "Papad", "Chivda",
      "Biscuits — Parle-G", "Biscuits — Cream", "Biscuits — Marie",
      "Roasted Peanuts / Chana",
    ],
    "Pickles & Chutneys": [
      "Mango Pickle (Achar)", "Mixed Pickle", "Lime / Lemon Pickle",
      "Green Chilli Pickle", "Garlic Pickle", "Tamarind Paste / Concentrate",
      "Mango Chutney", "Tamarind Chutney",
    ],
    // Phase 2/3: sparse children for navigation structure (no products yet)
    "Frozen Foods":                   ["Parathas", "Samosas", "Frozen Mixed Vegetables", "Frozen Peas"],
    "Fresh Produce":                  ["Curry Leaves", "Green Chillies", "Fresh Ginger", "Fresh Coriander"],
    "Ready-to-Cook & Instant Mixes":  ["Idli Mix", "Dosa Mix", "Dhokla Mix", "Gulab Jamun Mix"],
    "Condiments & Cooking Essentials": ["Coconut Milk", "Ginger-Garlic Paste", "Jaggery (Gur)"],
    "Pooja Essentials":               [],
    "Household & Kitchen":            [],
    "Regional Specialties":           ["Punjabi / North Indian", "Gujarati", "South Indian", "Bengali"],
  };

  const { result: parentResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: parents.map((cat) => ({
        name: cat.name,
        handle: cat.handle,
        is_active: cat.is_active,
        metadata: cat.metadata,
      })),
    },
  });

  const parentMap = new Map<string, string>();
  for (const cat of parentResult) {
    parentMap.set(cat.name, cat.id);
  }

  const childCategories: { name: string; handle: string; parent_category_id: string; is_active: boolean }[] = [];
  for (const [parentName, childNames] of Object.entries(children)) {
    const parentId = parentMap.get(parentName);
    if (parentId) {
      for (const childName of childNames) {
        const childHandle = childName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/[\s]+/g, "-")
          .replace(/-+/g, "-");
        childCategories.push({
          name: childName,
          handle: childHandle,
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
        { title: "Staples & Grains", handle: "staples-grains", metadata: { description: "Basmati, Sona Masoori, and more" } },
        { title: "Atta & Flours", handle: "atta-flours", metadata: { description: "Chakki atta, besan, maida" } },
        { title: "Dal & Lentils", handle: "dal-lentils", metadata: { description: "Toor, moong, masoor, chana" } },
        { title: "Oils & Ghee", handle: "oils-ghee", metadata: { description: "Mustard, sunflower, coconut, ghee" } },
        { title: "Spices — Whole", handle: "spices-whole", metadata: { description: "Cumin, mustard, cardamom, cloves" } },
        { title: "Spices — Ground", handle: "spices-ground", metadata: { description: "Turmeric, chilli, coriander powders" } },
        { title: "Spice Blends", handle: "spice-blends", metadata: { description: "Garam masala, MDH, Shan, Everest" } },
        { title: "Dairy & Eggs", handle: "dairy", metadata: { description: "Paneer, yoghurt, butter, cream" } },
        { title: "Beverages", handle: "beverages", metadata: { description: "Tea, coffee, Rooh Afza" } },
        { title: "Snacks & Namkeen", handle: "snacks-namkeen", metadata: { description: "Bhujia, sev, papad, biscuits" } },
        { title: "Pickles & Chutneys", handle: "pickles-chutneys", metadata: { description: "Mango, lime, mixed pickles" } },
        { title: "Frozen Foods", handle: "frozen", metadata: { description: "Parathas, samosas, frozen veg" } },
        { title: "Fresh Produce", handle: "fresh", metadata: { description: "Curry leaves, chillies, ginger" } },
        { title: "Ready-to-Cook", handle: "ready-to-cook", metadata: { description: "Instant mixes, idli, dosa" } },
        { title: "Condiments", handle: "condiments", metadata: { description: "Coconut milk, pastes, jaggery" } },
        { title: "Pooja Essentials", handle: "pooja", metadata: { description: "Agarbatti, camphor, puja items" } },
        { title: "Household & Kitchen", handle: "household", metadata: { description: "Tawa, kadhai, masala dabba" } },
        { title: "Regional Specialties", handle: "regional", metadata: { description: "Punjabi, Gujarati, South Indian, Bengali" } },
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
