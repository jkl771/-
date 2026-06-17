const fs=require('fs');
const p='C:/Users/HYH/Documents/视频智能体/public/bgm/library/1781534318275_Easter_Light.mp3';
try { fs.unlinkSync(p); console.log('deleted'); } catch(e){ console.log('err',e.code); }
console.log(fs.existsSync(p));