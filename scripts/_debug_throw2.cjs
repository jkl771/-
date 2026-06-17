const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const old = '    const result = runPythonScript(code, [ccMixterUrl]);';
const upd = '    const result = runPythonScript(code, [ccMixterUrl]); throw new Error(result.toString("utf-8").slice(0, 800));';
s = s.replace(old, upd);
fs.writeFileSync(p, s, 'utf-8');
console.log('throw-raw');
