const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let lines = fs.readFileSync(p, 'utf-8').split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("function escapePySingle(s: string) {")) {
    lines[i] = "function escapePySingle(s: string) {";
    lines[i+1] = "  return s.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, \"\\\\'\");";
    lines[i+2] = "}";
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf-8');
console.log('replaced-escape');
