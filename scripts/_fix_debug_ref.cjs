const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('debug: {source, query, limit, searchDebug}', 'debug: {source, query, limit}');
fs.writeFileSync(p, s, 'utf-8');
console.log('fixed-search-debug');
