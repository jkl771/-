const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('    const raw = result.toString(\'utf-8\').trim(); throw new Error("search-raw=" + raw);', '    const raw = result.toString(\'utf-8\').trim(); throw new Error("search-raw=" + raw.slice(0, 2000));');
fs.writeFileSync(p, s, 'utf-8');
console.log('throw-raw-label-2000');
