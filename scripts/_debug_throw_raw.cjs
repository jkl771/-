const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('    const raw = result.toString(\'utf-8\').trim(); console.log("bgm-raw", raw.slice(0, 300));', '    const raw = result.toString(\'utf-8\').trim(); throw new Error(raw.slice(0, 500));');
fs.writeFileSync(p, s, 'utf-8');
console.log('throw-raw');
