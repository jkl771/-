const fs=require('fs');
const p='C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts';
let c=fs.readFileSync(p,'utf8');
c=c.replace("execSync(`python \"${downloadScript}\" \"${url.replace(/\"/g,'\\\\\"')}\" \"${tempFile.replace(/\"/g,'\\\\\"')}\"`, { timeout: 35000, stdio: ['ignore','ignore','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });", "execSync(`python \"${downloadScript}\" \"${url.replace(/\"/g,'\\\\\"')}\" \"${tempFile.replace(/\"/g,'\\\\\"')}\"`, { timeout: 180000, stdio: ['ignore','ignore','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });");
fs.writeFileSync(p,c,'utf8');
console.log('patched-timeout');