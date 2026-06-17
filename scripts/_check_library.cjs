const fs=require('fs');
const dir='C:/Users/HYH/Documents/视频智能体/public/bgm/library';
console.log(fs.readdirSync(dir).map(f=>({f,len:fs.statSync(dir+'/'+f).size})));