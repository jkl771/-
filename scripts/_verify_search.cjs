const http=require('http');
const req=http.request({hostname:'127.0.0.1',port:3000,path:'/api/bgm?source=ccmixter&q=happy&limit=5',method:'GET'}, res=>{
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    const parsed=JSON.parse(data);
    console.log('status:',res.statusCode);
    console.log('total:',parsed.total);
    console.log('results:',parsed.data?.length||0);
    if(parsed.data?.length){
      parsed.data.forEach((item,i)=>{
        console.log(`  [${i}] ${item.name} | ${item.artist} | ${item.url?.substring(0,60)}`);
      });
    }
  });
});
req.on('error',e=>console.error(e));
req.end();