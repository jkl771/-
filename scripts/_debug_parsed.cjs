const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('    return parsed.map((item: any) => ({', '    throw new Error(JSON.stringify(parsed.slice(0,3)));\n    return parsed.map((item: any) => ({');
fs.writeFileSync(p, s, 'utf-8');
console.log('throw-parsed');
