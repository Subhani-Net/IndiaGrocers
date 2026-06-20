# MVP Duplicates Log — Existing CSV Matches

## Methodology

Each MVC product was cross-referenced against `../products.csv` using brand + category + product title fuzzy matching.

| Verdict | Meaning |
|---------|---------|
| **DUPLICATE** | Exact match — product is already in the main CSV. SKIP; do not add to mvp-products.csv |
| **PARTIAL** | Brand + category match; variant sizes may differ. Only missing variants were added to mvp-products.csv |
| **MISSING** | Brand not found OR brand + product combination absent. Full product added to mvp-products.csv |

---

## Category 1: Rice & Atta (22 SKUs)

| MVC SKU | Verdict | Existing Handle | Notes |
|---------|---------|----------------|-------|
| Elephant Atta Chakki Fresh 5kg | DUPLICATE | elephant-atta-5kg | Already in CSV |
| Elephant Atta Chakki Fresh 10kg | DUPLICATE | elephant-atta-10kg | Already in CSV |
| Pillsbury Chakki Fresh Atta 5kg | DUPLICATE | pillsbury-atta-5kg | Already in CSV |
| Pillsbury Chakki Fresh Atta 10kg | DUPLICATE | pillsbury-atta-10kg | Already in CSV |
| Aashirvaad Atta Select 5kg | DUPLICATE | aashirvaad-atta-5kg | Already in CSV |
| Aashirvaad Atta Select 10kg | DUPLICATE | aashirvaad-atta-10kg | Already in CSV |
| Tilda Pure Basmati 2kg | PARTIAL | tilda-pure-basmati | CSV has Tilda — add 10kg variant |
| Tilda Pure Basmati 5kg | DUPLICATE | tilda-pure-basmati | Already in CSV |
| Tilda Pure Basmati 10kg | PARTIAL | tilda-pure-basmati | Added 10kg variant |
| Kohinoor Extra Long Basmati 2kg | DUPLICATE | kohinoor-basmati | Already in CSV |
| Kohinoor Extra Long Basmati 5kg | DUPLICATE | kohinoor-basmati | Already in CSV |
| Lal Qilla Premium Basmati 5kg | DUPLICATE | lal-qilla-basmati | Already in CSV |
| Lal Qilla Premium Basmati 10kg | PARTIAL | lal-qilla-basmati | Added 10kg variant |
| Daawat Rozana Basmati 5kg | DUPLICATE | daawat-rozana-basmati | Already in CSV |
| Falak Super Basmati 5kg | DUPLICATE | falak-super-basmati | Already in CSV |
| East End Basmati 5kg | SKIPPED | — | Existing basmati coverage sufficient (Tilda, Kohinoor, Daawat, TRS already in CSV) |
| TRS Idli Rice 2kg | SKIPPED | — | Existing rice coverage sufficient |
| TRS Sona Masoori Rice 5kg | SKIPPED | — | Similar Natco rice products already in CSV |
| TRS Parboiled Rice 5kg | SKIPPED | — | Existing Natco parboiled rice in CSV |
| TRS Besan Gram Flour 1kg | PARTIAL | trs-besan | CSV has TRS Gram Flour |
| East End Sooji Fine 500g | MISSING | — | East End brand not in CSV |
| TRS Rice Flour 1kg | SKIPPED | — | Existing rice/flour coverage sufficient |

## Category 2: Lentils, Pulses & Dals (26 SKUs)

| MVC SKU | Verdict | Existing Handle | Notes |
|---------|---------|----------------|-------|
| TRS Toor Dal Oily 1kg | PARTIAL | trs-toor-dal | CSV has TRS Toor Dal |
| TRS Toor Dal Oily 2kg | PARTIAL | trs-toor-dal | Added 2kg variant |
| TRS Toor Dal Dry 1kg | MISSING | — | Not in CSV |
| East End Toor Dal Oily 2kg | MISSING | — | East End not in CSV |
| TRS Chana Dal 1kg | DUPLICATE | trs-chana-dal | Already in CSV |
| East End Chana Dal 2kg | MISSING | — | East End not in CSV |
| TRS Moong Dal Washed Yellow 1kg | PARTIAL | trs-moong-dal | CSV has TRS Mung Dal |
| East End Moong Dal Washed 2kg | MISSING | — | East End not in CSV |
| TRS Moong Whole Green 1kg | MISSING | — | Not in CSV |
| TRS Red Split Lentils 500g | PARTIAL | trs-red-lentils | CSV has TRS Red Lentils |
| TRS Red Split Lentils 2kg | PARTIAL | trs-red-lentils | Added 2kg variant |
| East End Red Split Lentils 2kg | MISSING | — | East End not in CSV |
| TRS Urad Dal Washed White 500g | DUPLICATE | trs-urad-dal | Already in CSV |
| TRS Urad Dal Black Whole 1kg | MISSING | — | Not in CSV |
| East End Urad Dal Black Whole 2kg | MISSING | — | East End not in CSV |
| TRS Kabuli Chana 1kg | PARTIAL | trs-kabuli-chana | CSV has similar |
| East End Kabuli Chana 2kg | MISSING | — | East End not in CSV |
| TRS Red Kidney Beans 1kg | DUPLICATE | trs-rajma | Already in CSV |
| TRS Dark Red Kidney Beans 1kg | MISSING | — | Not in CSV |
| TRS Kala Chana 1kg | MISSING | — | Not in CSV |
| TRS Black Eye Beans Lobia 1kg | DUPLICATE | trs-lobia | Already in CSV |
| TRS Mixed Panchratna Dal 1kg | MISSING | — | Not in CSV |
| TRS Roasted Chana Daria 500g | MISSING | — | Not in CSV |
| Natco Roasted Chana Dal 500g | DUPLICATE | natco-roasted-chana | Already in CSV |
| TRS Roasted Peanuts 500g | MISSING | — | Not in CSV |
| Haldiram's Chana Dal Fried 400g | DUPLICATE | haldirams-chanadal | Already in CSV |

## Category 3: Spices & Powders (32 SKUs)

| MVC SKU | Verdict | Existing Handle | Notes |
|---------|---------|----------------|-------|
| TRS Turmeric Powder 200g | DUPLICATE | trs-turmeric | Already in CSV |
| TRS Turmeric Powder 400g | PARTIAL | trs-turmeric | Added 400g variant |
| TRS Chilli Powder Mild 200g | PARTIAL | trs-chilli | CSV has TRS Chilli |
| TRS Chilli Powder Hot 200g | MISSING | — | Not in CSV |
| MDH Deggi Mirch 100g | DUPLICATE | mdh-deggi-mirch | Already in CSV |
| TRS Coriander Powder 200g | DUPLICATE | trs-coriander-powder | Already in CSV |
| East End Coriander Powder 400g | MISSING | — | East End not in CSV |
| TRS Cumin Powder 200g | DUPLICATE | trs-cumin-powder | Already in CSV |
| TRS Garam Masala 200g | DUPLICATE | trs-garam-masala | Already in CSV |
| MDH Garam Masala 100g | DUPLICATE | mdh-garam-masala | Already in CSV |
| TRS Kashmiri Chilli Powder 200g | MISSING | — | Not in CSV |
| East End Kashmiri Chilli Powder 200g | MISSING | — | East End not in CSV |
| MDH Chaat Masala 100g | DUPLICATE | mdh-chaat-masala | Already in CSV |
| TRS Dry Mango Powder Amchur 100g | DUPLICATE | trs-amchur | Already in CSV |
| TRS Roasted Cumin Powder 100g | MISSING | — | Not in CSV |
| TRS Cumin Seeds Jeera 200g | DUPLICATE | trs-cumin-seeds | Already in CSV |
| TRS Mustard Seeds Black 200g | PARTIAL | trs-mustard | CSV has TRS Mustard |
| TRS Coriander Seeds 200g | DUPLICATE | trs-coriander-seeds | Already in CSV |
| TRS Fenugreek Seeds Methi 200g | DUPLICATE | trs-methi | Already in CSV |
| TRS Fennel Seeds Saunf 200g | DUPLICATE | trs-fennel | Already in CSV |
| TRS Carom Seeds Ajwain 100g | DUPLICATE | trs-ajwain | Already in CSV |
| TRS Green Cardamom 100g | DUPLICATE | trs-cardamom | Already in CSV |
| TRS Cinnamon Sticks 100g | DUPLICATE | trs-cinnamon | Already in CSV |
| TRS Cloves 100g | DUPLICATE | trs-cloves | Already in CSV |
| TRS Black Peppercorns 200g | DUPLICATE | trs-peppercorns | Already in CSV |
| LG Asafoetida Hing 100g | MISSING | — | LG brand not in CSV |
| TRS Kasuri Methi 50g | DUPLICATE | trs-kasuri-methi | Already in CSV |
| TRS Saffron 1g | DUPLICATE | trs-saffron | Already in CSV |
| TRS Rose Water 190ml | MISSING | — | Not in CSV |
| TRS Kewra Water 190ml | MISSING | — | Not in CSV |

## Category 4: Masalas & Dessert Mixes (38 SKUs)

| MVC SKU | Verdict | Existing Handle | Notes |
|---------|---------|----------------|-------|
| Shan — 18 masalas | DUPLICATE (16/18) | shan-* | Most Shan variants in CSV. Missing: Pilau Rice, Achar Gosht |
| MDH — 10 masalas | DUPLICATE (9/10) | mdh-* | Most MDH in CSV. Missing: Sambar Masala |
| Everest — 4 masalas | MISSING (all 4) | — | Everest brand not in CSV |
| Laziza — 6 dessert mixes | MISSING (all 6) | — | Laziza brand not in CSV |

## Category 5: Namkeens & Biscuits (28 SKUs)

| MVC SKU | Verdict | Existing Handle | Notes |
|---------|---------|----------------|-------|
| Haldiram's Aloo Bhujia 200g/400g/1kg | DUPLICATE | haldirams-aloo-bhujia | All 3 variants in CSV |
| Haldiram's Moong Dal 200g/400g | DUPLICATE | haldirams-moong-dal | In CSV |
| Haldiram's All In One Mix 200g | DUPLICATE | haldirams-all-in-one | In CSV |
| Haldiram's Khatta Meetha Mix 200g | DUPLICATE | haldirams-khatta-meetha | In CSV |
| Haldiram's Dalmoth 200g | DUPLICATE | haldirams-dalmoth | In CSV |
| Haldiram's Bhujia Sev 200g | DUPLICATE | haldirams-bhujia-sev | In CSV |
| Haldiram's Mathri 200g | MISSING | — | Not in CSV |
| Bikaji Bhujia 200g | DUPLICATE | bikaji-bhujia | In CSV |
| Bikaji All In One Mix 200g | DUPLICATE | bikaji-all-in-one | In CSV |
| Bikaji Khatta Meetha 200g | MISSING | — | Not in CSV |
| Lijjat Urad Papad Extra Thin 200g | DUPLICATE | lijjat-urad-papad | In CSV |
| Lijjat Urad Special Papad 200g | DUPLICATE | lijjat-urad-special | In CSV |
| Lijjat Moong Dal Papad 200g | DUPLICATE | lijjat-moong-papad | In CSV |
| Parle-G 400g/1kg | DUPLICATE | parle-g | Both in CSV |
| Parle Monaco 200g | DUPLICATE | parle-monaco | In CSV |
| Parle Bourbon 200g | DUPLICATE | parle-bourbon | In CSV |
| Britannia Good Day Butter 150g | DUPLICATE | britannia-good-day | In CSV |
| Britannia Good Day Cashew 150g | DUPLICATE | britannia-good-day-cashew | In CSV |
| Britannia Marie Gold 200g | DUPLICATE | britannia-marie-gold | In CSV |
| Britannia Bourbon Cream 200g | DUPLICATE | britannia-bourbon | In CSV |
| Karachi Bakery Fruit 400g | MISSING | — | Karachi Bakery not in CSV |
| Karachi Bakery Osmania 400g | MISSING | — | Karachi Bakery not in CSV |
| TRS Cashew Nuts W320 250g | DUPLICATE | trs-cashew | In CSV |
| TRS Makhana 100g | DUPLICATE | trs-makhana | In CSV |

## Categories 6-9: Summary (All products below are MISSING and added to mvp-products.csv)

| MVC Category | Missing Products | Key Missing Brands |
|--------------|-----------------|-------------------|
| Ready-to-Eat & Frozen (26 SKUs) | 21 products → 13 after frozen deferral | Shana (DEFERRED — Phase 2 frozen/cold-chain), Nanak (DEFERRED), East End Paneer (DEFERRED). Ashoka, MTR, Maggi included now.
| Confectionery (16 SKUs) | 11 products | MTR tins, Cadbury imports, Amul, Hajmola |
| Beverages (24 SKUs) | 16 products | Wagh Bakri, Girnar, Tata, Brooke Bond, Udhayam, Leo Coffee, Bru, Bovonto, Rasna, Dabur, Glucon-D, Frooti, Nescafe |
| Pickles & Accompaniments (30 SKUs) | 20 products | Priya, Aachi, National, Ching's, Idhayam, Parachute, Amul Ghee, TRS/Idhayam oils |

---

## Totals

| Verdict | Count |
|---------|-------|
| DUPLICATE (already in CSV) | ~108 |
| PARTIAL (add missing variants) | ~20 |
| MISSING (brand or product absent) | ~114 |
| DEFERRED (frozen/cold-chain — Phase 2) | ~8 (Shana 6 + Nanak 1 + East End Paneer 1) |
| **Total MVC products** | **242** |
| SKIPPED (existing coverage sufficient) | 5 | TRS/East-End rice products — CSV already has equivalent coverage |
| **New variant rows (current)** | **124** |
