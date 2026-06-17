const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('      const raw = await searchCcmixter(query, limit); throw new Error(JSON.stringify(raw).slice(0, 500));', '      const raw = runPythonScript("import sys,json\\nprint(json.dumps([1,2,3]))", [], 5000); throw new Error(raw.toString("utf-8").trim());');
fs.writeFileSync(p, s, 'utf-8');
console.log('probe-raw');
