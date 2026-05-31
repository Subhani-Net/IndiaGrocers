var http=require('http');
var filter='category_handle = "spices-herbs"';

function test(q,label){
  return new Promise(function(resolve){
    var d=JSON.stringify({q:q,limit:3,filter:filter});
    var rq=http.request({hostname:'localhost',port:7700,path:'/indexes/products/search',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}},function(r){var b='';r.on('data',function(c){b+=c});r.on('end',function(){
    var j=JSON.parse(b);console.log(label+': '+j.hits.length+' hits, total='+(j.estimatedTotalHits||j.totalHits));resolve();
    })});rq.write(d);rq.end();
  });
}

(async function(){
  await test('','empty');
  await test('chilli','chilli');
  await test('chilli mirch','chilli+mirch');
  await test('chilli mirch cardamom','3 words');
  await test('Christmas','Christmas');
  console.log('done');
})();
