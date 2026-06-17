const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('    const raw = result.toString(\'utf-8\').trim(); throw new Error(raw);', '    const raw = result.toString(\'utf-8\').trim(); throw new Error("search-raw=" + raw.slice(0, 800));');
fs.writeFileSync(p, s, 'utf-8');
console.log('throw-raw-label');
