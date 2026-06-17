const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const old = "let debug: any = undefined; try { const raw = runPythonScript('import sys,json\\nprint(json.dumps([1,2,3]))', [], 5000); debug = {probe: raw.toString().trim()}; } catch (e:any) { debug = {probeErr: e?.message||String(e)}; } return NextResponse.json({ success: true, data: results, total: results.length, debug });";
const upd = "let debug: any = undefined; try { const raw = runPythonScript('import sys,json\\nprint(json.dumps([1,2,3]))', [], 5000); debug = {probe: raw.toString().trim(), source, query, limit}; } catch (e:any) { debug = {probeErr: e?.message||String(e), source, query, limit}; } return NextResponse.json({ success: true, data: results, total: results.length, debug });";
s = s.replace(old, upd);
fs.writeFileSync(p, s, 'utf-8');
console.log('probe-params');
