const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const old = `    return NextResponse.json({ success: true, data: results, total: results.length });`;
const upd = `    return NextResponse.json({ success: true, data: results, total: results.length, debug: { onlineQuery: query, onlineSource: source } });`;
s = s.replace(old, upd);
const catchBlock = `  } catch (e: any) {
    return NextResponse.json({ success: true, data: results, total: results.length, debug: { error: e?.message || 'search failed' } });
  }`;
s = s.replace(/  } catch \{\n    return \[\];\n  }\n\}/, `  } catch {\n    return [];\n  }\n}\n`);
const oldRouteCatch = `export async function GET(req: NextRequest) {\n  const sp = req.nextUrl.searchParams;\n  const query = sp.get('q') || '';\n  const source = sp.get('source') || 'all';\n  const limit = Math.min(parseInt(sp.get('limit') || '20', 10), 50);\n\n  const results: BgmItem[] = [];`;
fs.writeFileSync(p, s, 'utf-8');
console.log('added-debug');
