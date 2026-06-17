const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('      try { results.push(...await searchCcmixter(query, limit)); } catch (e:any) { /* ignore */ }', '      const raw = await searchCcmixter(query, limit); throw new Error(JSON.stringify(raw).slice(0, 500));');
fs.writeFileSync(p, s, 'utf-8');
console.log('get-throw-raw');
