var fs=require('fs');
var raw=fs.readFileSync('D:/Dump/IndiaGrocers-Fix/Implementation/TRS_products/products.json','utf-8');
var trs=JSON.parse(raw.replace(/^\uFEFF/,''));

// TRS category → our subcategory mapping
var CAT_MAP={
  'Spices':'spices-herbs',
  'Pulses':'dried-lentils-beans-peas',
  'Flours':'flours',
  'Rice':'rice-quinoa',
  'Condiments Sauces':'chutneys-pickles-sauces',
  'Dried Fruit Nuts':'raw-nuts',
  'Snacks':'namkeen-lentil-snacks',
  'Cans':'tinned-products-parent',
  'Speciality':'seeds',
};

// Subcategory refinements based on product name keywords
function getChildCategory(name, parentCat) {
  var t=name.toLowerCase();
  // Spices refinements
  if(t.includes('all purpose')||t.includes('garam masala')||t.includes('tandoori')||
     t.includes('chicken masala')||t.includes('curry powder')||t.includes('chana masala')||
     t.includes('chaat masala')||t.includes('biryani')||t.includes('pav bhaji'))
    return 'spice-blends-mixes';
  if(t.includes('food colour')||t.includes('essence')||t.includes('flavouring')||t.includes('rose water'))
    return 'food-colourings-essences';
  
  // Pulses refinements
  if(t.includes('soya')&&!t.includes('soya bean'))
    return 'soya-products';
  if(t.includes('boiled')||t.includes('tinned'))
    return 'tinned-lentils-beans';
  
  // Rice refinements
  if(t.includes('rice'))
    return 'rice-quinoa';
  // Flours refinements
  if(t.includes('atta')||t.includes('chapati')) return 'flours';
  
  // Snacks refinements
  if(t.includes('papad')||t.includes('pappad'))
    return 'pappadoms';
  
  // Nuts refinements
  if(t.includes('dried')||t.includes('date')||t.includes('raisin'))
    return 'dried-fruit';
  
  // Default: parent-level subcategory
  return CAT_MAP[parentCat]||parentCat.toLowerCase().replace(/[^a-z0-9]+/g,'-');
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').slice(0,80);
}

console.log('=== TRS PRODUCT → SUBCATEGORY MAPPING ===\n');
var bySub={};
trs.forEach(function(p,i){
  var sub=getChildCategory(p.product_name, p.category);
  bySub[sub]=(bySub[sub]||0)+1;
  console.log((i+1)+'. '+p.product_name.padEnd(45)+' → '+sub+' (TRS: '+p.category+')');
});
console.log('\n=== SUMMARY ===');
Object.entries(bySub).sort(function(a,b){return b[1]-a[1]}).forEach(function(e){
  console.log('  '+e[1]+' → '+e[0]);
});
console.log('  ---');
console.log('  '+trs.length+' total');
