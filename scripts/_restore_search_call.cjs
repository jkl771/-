const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('      const raw = runPythonScript("import sys,json\\nprint(json.dumps([1,2,3]))", [], 5000); throw new Error(raw.toString("utf-8").trim());', '      results.push(...await searchCcmixter(query, limit));');
fs.writeFileSync(p, s, 'utf-8');
console.log('restore-search-call');
