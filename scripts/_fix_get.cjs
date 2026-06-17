const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const start = s.indexOf('export async function GET(req: NextRequest) {');
const end = s.indexOf('export async function POST(req: NextRequest) {');
const getFn = `export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const query = sp.get('q') || '';
    const source = sp.get('source') || 'all';
    const limit = Math.min(parseInt(sp.get('limit') || '20', 10), 50);

    const results: BgmItem[] = [];
    if (source === 'library' || source === 'all') {
      results.push(...await listLibraryBgm());
    }
    if (source === 'builtin' || source === 'all') {
      results.push(...await listBuiltinBgm());
    }
    if ((source === 'ccmixter' || source === 'all') && query) {
      results.push(...await searchCcmixter(query, limit));
    }
    if (source === 'ccmixter' && !query) {
      results.push(...await searchCcmixter('background music', limit));
    }
    return NextResponse.json({ success: true, data: results, total: results.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}

`;
s = s.slice(0, start) + getFn + s.slice(end);
fs.writeFileSync(p, s, 'utf-8');
console.log('fixed-get');
