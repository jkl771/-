const http=require('http');
const req=http.request({hostname:'127.0.0.1',port:3000,path:'/api/bgm?source=ccmixter&q=calm&limit=3',method:'GET'}, res=>{
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{console.log('status',res.statusCode); console.log(data.slice(0,400));});
});
req.on('error',e=>console.error(e));
req.end();