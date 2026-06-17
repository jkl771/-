const http=require('http');
const body=JSON.stringify({url:'https://ccmixter.org/content/SiobhanD/SiobhanD_-_Easter_Light_(Moonlight_Mix)_1.mp3',name:'Easter Light'});
const req=http.request({hostname:'127.0.0.1',port:3000,path:'/api/bgm',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res=>{
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{console.log('status',res.statusCode); console.log(data.slice(0,500));});
});
req.setTimeout(5000);
req.on('error',e=>console.error(e));
req.write(body);
req.end();