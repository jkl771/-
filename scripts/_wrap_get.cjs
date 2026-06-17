const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('export async function GET(req: NextRequest) {\n', 'export async function GET(req: NextRequest) {\ntry {\n');
s = s.replace('  return NextResponse.json({ success: true, data: results, total: results.length, debug: { onlineQuery: query, onlineSource: source } });\n}\n', '  return NextResponse.json({ success: true, data: results, total: results.length, debug: { onlineQuery: query, onlineSource: source } });\n} catch (e: any) {\n  return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });\n}\n}\n');
fs.writeFileSync(p, s, 'utf-8');
console.log('wrapped-get');
