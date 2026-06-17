const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('      throw new Error("get-search-call");', '      try { results.push(...await searchCcmixter(query, limit)); } catch (e:any) { /* ignore */ }');
fs.writeFileSync(p, s, 'utf-8');
console.log('restored-call');
