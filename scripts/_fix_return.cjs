const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let lines = fs.readFileSync(p, 'utf-8').split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("let debug: any = undefined; try { const raw = runPythonScript('import sys,json")) {
    lines[i] = '    return NextResponse.json({ success: true, data: results, total: results.length, debug: {source, query, limit, searchDebug} });';
    break;
  }
}
fs.writeFileSync(p, lines.join('\n'), 'utf-8');
console.log('fixed-return');
