const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', 'utf-8');

// 添加 Audius 搜索函数
const audiusFunction = `
async function searchAudius(query: string, limit = 10): Promise<BgmItem[]> {
  try {
    const searchUrl = \`https://api.audius.co/v1/tracks/search?query=\${encodeURIComponent(query)}&app_name=video-agent&limit=\${limit}\`;
    const resp = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json() as any;
    if (!data.data || !Array.isArray(data.data)) return [];
    
    return data.data.map((track: any) => ({
      id: 'audius_' + track.id,
      name: track.title || 'Unknown',
      category: track.genre || '在线',
      source: 'ccmixter' as const,
      url: \`https://api.audius.co/v1/tracks/\${track.id}/stream?app_name=video-agent\`,
      artist: track.user?.name || '',
      tags: (track.tags || []).filter(Boolean).slice(0, 6),
    }));
  } catch (e) {
    console.warn('[BGM] Audius search failed:', e);
    return [];
  }
}
`;

// 在 GET 函数前添加 Audius 搜索函数
content = content.replace(
  'export async function GET(req: NextRequest) {',
  audiusFunction + '\nexport async function GET(req: NextRequest) {'
);

// 修改 GET 函数：添加在线搜索
const oldGet = `const results: BgmItem[] = [];
    if (source === 'library' || source === 'all') {
      results.push(...await listLibraryBgm());
    }
    if (source === 'builtin' || source === 'all') {
      results.push(...await listBuiltinBgm());
    }
    return NextResponse.json({ success: true, data: results, total: results.length });`;

const newGet = `const results: BgmItem[] = [];
    if (source === 'library' || source === 'all') {
      results.push(...await listLibraryBgm());
    }
    if (source === 'builtin' || source === 'all') {
      results.push(...await listBuiltinBgm());
    }
    if ((source === 'audius' || source === 'all') && query) {
      const audiusResults = await searchAudius(query, limit);
      results.push(...audiusResults);
    }
    return NextResponse.json({ success: true, data: results, total: results.length });`;

content = content.replace(oldGet, newGet);

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', content, 'utf-8');
console.log('Added Audius search to BGM API');
