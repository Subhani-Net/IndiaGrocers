var http=require('http');
// Test searchProducts directly - exact same call the page makes
var pseudoQuery='snacks all-snacks pappadoms chutneys-pickles-sauces namkeen-lentil-snacks flavoured-nuts-snacks raisins-snacks';
var filter='category_handle IN ["snacks","all-snacks","pappadoms","chutneys-pickles-sauces","namkeen-lentil-snacks","flavoured-nuts-snacks","raisins-snacks"]';

// Call 1: with limit 200, same as page
var d=JSON.stringify({q:pseudoQuery,limit:200,filter:filter});
var req=http.request({hostname:'localhost',port:7700,path:'/indexes/products/search',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},function(r){var b='';r.on('data',function(c){b+=c});r.on('end',function(){
var j=JSON.parse(b);
console.log('Limit 200: hits='+j.hits.length+' totalHits='+(j.estimatedTotalHits||j.totalHits));

// Call 2: with limit 20 (in case default is somehow applied)
var d2=JSON.stringify({q:pseudoQuery,limit:20,filter:filter});
var req2=http.request({hostname:'localhost',port:7700,path:'/indexes/products/search',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d2)}},function(r2){var b2='';r2.on('data',function(c2){b2+=c2});r2.on('end',function(){
var j2=JSON.parse(b2);
console.log('Limit 20:  hits='+j2.hits.length+' totalHits='+(j2.estimatedTotalHits||j2.totalHits));
console.log('\nIs limit 20 returning 17? '+(j2.hits.length===17?'YES':'No, '+j2.hits.length));
})});req2.write(d2);req2.end()
})});req.write(d);req.end()
