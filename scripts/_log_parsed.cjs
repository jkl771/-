const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('    throw new Error(JSON.stringify(parsed.slice(0,3)));', '    console.log("parsed-count", parsed.length, JSON.stringify(parsed.slice(0,3)));');
fs.writeFileSync(p, s, 'utf-8');
console.log('log-parsed');
