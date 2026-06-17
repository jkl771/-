const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace("    let debug: any = undefined; try { const raw = runPythonScript('import sys,json\\nprint(json.dumps([1,2,3]))', [], 5000); debug = {probe: raw.toString().trim(), source, query, limit, searchErr: searchDebug}; } catch (e:any) { debug = {probeErr: e?.message||String(e), source, query, limit, searchErr: searchDebug}; } return NextResponse.json({ success: true, data: results, total: results.length, debug });", "    return NextResponse.json({ success: true, data: results, total: results.length, debug: {source, query, limit, raw: results.length ? undefined : 'empty'} });");
fs.writeFileSync(p, s, 'utf-8');
console.log('simple-debug');
