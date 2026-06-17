const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('      try { results.push(...await searchCcmixter(query, limit)); } catch (e:any) { searchDebug = e?.message || String(e); }', '      throw new Error("get-search-call");');
fs.writeFileSync(p, s, 'utf-8');
console.log('get-throw');
