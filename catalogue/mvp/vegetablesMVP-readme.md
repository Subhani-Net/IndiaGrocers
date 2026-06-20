# Fresh Vegetables MVP — 18 SKU Curated Dataset

**Status:** Finalized MVP — NOT yet integrated into main products.csv  

## Files

| File | Contents |
|------|----------|
| `vegetablesMVP-seed.json` | 18 Medusa Admin API product creation payloads |
| `vegetablesMVP-readme.md` | This file |

## Sourcing Strategy (sourcing_note)

| Code | Name | Products | Logic |
|------|------|----------|-------|
| `AMB_STAPLE` | Ambient Staple | Indian Onion, Mud Potato, Vine Tomato, Arbi | No cold chain required. Bulk ambient supplier. Steady year-round demand. |
| `MARGIN_PACK` | Margin Pack | Ginger, Garlic, Green Chillies, Green Lime | Small-weight packs with high margin %. Buy at wholesale weight, repack for retail. |
| `CORE_VOL` | Core Volume | Okra, Dudhi, Karela, Tindora, Cassava | Highest-volume drivers. Weekly fresh supply contracts. Priority cold-chain allocation. |
| `SI_ANCHOR` | South Indian Anchor | Drumsticks, Coconut, Small Onion | Community-retention products. Must NEVER stock out — anchors the South Indian customer. |
| `SAT_FRESH` | Saturday Fresh | Curry Leaves | Maximum freshness required. Packed Friday night for Saturday morning delivery window. |
| `REG_SPEC` | Regional Specialty | Green Plantains | Niche community demand. Lower velocity but high basket attachment. |

## 18 SKU Product List

| # | Handle | Title | Weight | Variant | Barcode | Strategy | Price |
|---|--------|-------|--------|---------|---------|----------|-------|
| 1 | indian-onion | Indian Onion | 1kg | 1kg Bag | VEG_IND_ONION_1KG | AMB_STAPLE | £1.49 |
| 2 | mud-potato | Mud Potato | 2kg | 2kg Bag | VEG_MUD_POT_2KG | AMB_STAPLE | £2.99 |
| 3 | ginger | Ginger | 250g | 250g Pack | VEG_GINGER_250G | MARGIN_PACK | £2.49 |
| 4 | garlic | Garlic | 250g | 250g Pack | VEG_GARLIC_250G | MARGIN_PACK | £2.29 |
| 5 | okra | Okra / Bhindi | 500g | 500g Pack | VEG_OKRA_500G | CORE_VOL | £4.29 |
| 6 | green-chillies | Green Chillies | 200g | 200g Pack | VEG_G_CHILLI_200G | MARGIN_PACK | £1.69 |
| 7 | bottle-gourd | Bottle Gourd / Dudhi | SGL | Single | VEG_DUDHI_SGL | CORE_VOL | £3.99 |
| 8 | bitter-gourd | Bitter Gourd / Karela | 500g | 500g Pack | VEG_KARELA_500G | CORE_VOL | £4.99 |
| 9 | drumsticks | Drumsticks | 250g | 250g Pack | VEG_DRUMSTICK_250G | SI_ANCHOR | £2.69 |
| 10 | tindora | Tindora | 500g | 500g Pack | VEG_TINDORA_500G | CORE_VOL | £4.39 |
| 11 | curry-leaves | Curry Leaves | 50g | 50g Pack | VEG_CURRY_LV_50G | SAT_FRESH | £2.49 |
| 12 | vine-tomato | Vine Tomato | 500g | 500g Pack | VEG_TOMATO_500G | AMB_STAPLE | £3.49 |
| 13 | green-lime | Green Lime | 4pk | 4 Pack | VEG_LIME_4PK | MARGIN_PACK | £1.99 |
| 14 | coconut | Coconut | SGL | Single | VEG_COCONUT_SGL | SI_ANCHOR | £1.69 |
| 15 | small-onion | Small Onion / Shallots | 500g | 500g Pack | VEG_SM_ONION_500G | SI_ANCHOR | £4.49 |
| 16 | green-plantains | Green Plantains | SGL | Single | VEG_G_PLANTAIN | REG_SPEC | £4.49 |
| 17 | cassava | Cassava / Mogo | 1kg | 1kg Pack | VEG_CASSAVA_1KG | CORE_VOL | £2.99 |
| 18 | arbi | Arbi / Taro Root | 500g | 500g Pack | VEG_ARBI_500G | AMB_STAPLE | £4.99 |

## Barcode Convention

All 18 SKUs use `VEG_` prefix (not `GEN_`). Format: `VEG_{PRODUCT}_{WEIGHT}`

| Field | Example |
|-------|---------|
| Product barcode | `VEG_IND_ONION_1KG` |
| Goes in | `variant.metadata.barcode` |
| Validation | Must pass Zod `.startsWith("VEG_")` when integrated with seed-catalogue.mjs |

## Metadata Envelope

Each product carries `sourcing_note` in both:
- `metadata.sourcing_note` (product-level)
- `variants[0].metadata.sourcing_note` (variant-level)

This allows the storefront to filter/display by sourcing strategy (e.g., "Saturday Fresh" badge on Curry Leaves).

## Integration Notes

1. Category `fresh_veg` must exist in `categories.csv` (lowercase, alphanumeric + underscores)
2. The `VEG_` barcode prefix must be added to Zod schema validators
3. Prices are in pence (GBP minor unit) in the JSON payload
4. All products are single-variant
5. `metadata.brand_slug = "generic"` — no branded supplier
6. All products carry `vat_rate: 0` (zero-rated grocery)
7. Some products carry `requires_cold_chain: true` (Okra, Curry Leaves) — restricts to cold-chain delivery slots
8. `regional_tags` set per product (south-indian, gujarati, east-african-asian)

## To Seed from JSON

```bash
# Use the JSON payload directly with Medusa Admin API
cd catalogue/mvp
node -e "
const data = require('./vegetablesMVP-seed.json');
// POST /admin/products for each entry
"
```
