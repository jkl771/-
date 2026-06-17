const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace("return s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\''\");", "return s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\");");
fs.writeFileSync(p, s, 'utf-8');
console.log('fixed-escape');
