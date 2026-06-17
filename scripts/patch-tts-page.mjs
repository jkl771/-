import fs from 'fs';
const p = 'C:\\Users\\HYH\\Documents\\视频智能体\\app\\tts\\page.tsx';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/className=\\([^\n>]*?)\\>/g, 'className= >');
fs.writeFileSync(p, s, 'utf8');
console.log('patched');
