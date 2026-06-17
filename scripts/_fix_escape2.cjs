const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const bad = "return s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\''\");";
const good = "return s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\");";
s = s.replace(bad, good);
fs.writeFileSync(p, s, 'utf-8');
console.log('patched-escape');
