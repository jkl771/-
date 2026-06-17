const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const old = '    return NextResponse.json({ success: true, data: results, total: results.length, debug: {probe: raw.toString().trim()} });';
const upd = '    return NextResponse.json({ success: true, data: results, total: results.length, debug: {probe: raw.toString().trim(), source, query, limit} });';
s = s.replace(old, upd);
fs.writeFileSync(p, s, 'utf-8');
console.log('added-source-query');
