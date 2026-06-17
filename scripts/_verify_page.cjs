const http=require('http');
const req=http.request({hostname:'127.0.0.1',port:3000,path:'/tts',method:'GET'}, res=>{
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    console.log('status:',res.statusCode);
    // Check for key elements
    const checks=[
      ['searchOnline', data.includes('searchOnline')],
      ['onlineQuery', data.includes('onlineQuery')],
      ['onlineResults', data.includes('onlineResults')],
      ['previewOnline', data.includes('previewOnline')],
      ['importToLibrary', data.includes('importToLibrary')],
      ['在线搜索', data.includes('\\u5728\\u7ebf\\u641c\\u7d22')],
      ['ccMixter', data.includes('ccmixter')],
      ['no compile error', !data.includes('Module not found') && !data.includes('SyntaxError')],
    ];
    checks.forEach(([name,ok])=>console.log(`  ${ok?'✅':'❌'} ${name}`));
  });
});
req.on('error',e=>console.error(e));
req.end();