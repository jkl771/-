import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface BgmItem {
  id: string;
  name: string;
  category: string;
  source: 'builtin' | 'library' | 'audius';
  url: string;
  artist?: string;
  tags?: string[];
}

const BUILTIN_META: Record<string, { name: string; category: string; tags: string[] }> = {
  'ambient.mp3': { name: '轻音乐', category: '舒缓', tags: ['ambient', 'light'] },
  'cheerful_pop.mp3': { name: '轻快节拍', category: '活力', tags: ['pop', 'cheerful', 'upbeat'] },
  'deep_documentary.mp3': { name: '深沉纪录片', category: '严肃', tags: ['documentary', 'deep', 'serious'] },
  'energetic_electronic.mp3': { name: '活力电子', category: '电子', tags: ['electronic', 'energetic', 'tech'] },
  'gentle_ambient.mp3': { name: '轻柔氛围', category: '舒缓', tags: ['ambient', 'gentle', 'calm'] },
  'quiet_noise.mp3': { name: '安静白噪', category: '白噪', tags: ['noise', 'quiet', 'focus'] },
  'upbeat.mp3': { name: '欢快节奏', category: '活力', tags: ['upbeat', 'happy', 'bright'] },
  'warm.mp3': { name: '温暖钢琴', category: '温馨', tags: ['warm', 'piano', 'soft'] },
};

async function listBuiltinBgm(): Promise<BgmItem[]> {
  try {
    const bgmDir = path.join(process.cwd(), 'public', 'bgm');
    const files = await fs.readdir(bgmDir);
    return files.filter(f => f.endsWith('.mp3')).map(f => {
      const meta = BUILTIN_META[f] || { name: f.replace('.mp3', ''), category: '其他', tags: [] };
      return { id: 'builtin_' + f, name: meta.name, category: meta.category, source: 'builtin' as const, url: '/bgm/' + f, tags: meta.tags };
    });
  } catch {
    return [];
  }
}

async function listLibraryBgm(): Promise<BgmItem[]> {
  const libraryDir = path.join(process.cwd(), 'public', 'bgm', 'library');
  try {
    await fs.mkdir(libraryDir, { recursive: true });
    const files = await fs.readdir(libraryDir);
    const allow = new Set(['.mp3', '.wav', '.ogg']);
    return files.filter(f => allow.has(path.extname(f).toLowerCase())).map(f => ({
      id: 'lib_' + f, name: path.basename(f, path.extname(f)), category: '我的音乐库', source: 'library' as const, url: '/bgm/library/' + f
    }));
  } catch {
    return [];
  }
}

async function searchAudius(query: string, limit = 10): Promise<BgmItem[]> {
  try {
    const nodeFetch = (await import('node-fetch')).default;
    const searchUrl = 'https://api.audius.co/v1/tracks/search?query=' + encodeURIComponent(query) + '&app_name=video-agent&limit=' + limit;
    console.log('[BGM] Searching Audius:', searchUrl); console.log('[BGM] nodeFetch type:', typeof nodeFetch);
    const resp = await nodeFetch(searchUrl);
    console.log('[BGM] Audius resp status:', resp.status, 'ok:', resp.ok); if (!resp.ok) { console.warn('[BGM] Audius search failed:', resp.status); return []; }
    const data = await resp.json() as any;
    console.log('[BGM] Audius data type:', typeof data, 'has data:', !!data.data, 'isArray:', Array.isArray(data.data)); if (!data.data || !Array.isArray(data.data)) { console.warn('[BGM] Audius invalid response'); return []; }
    console.log('[BGM] Audius found', data.data.length, 'tracks');
    return data.data.map((track: any) => ({
      id: 'audius_' + track.id,
      name: track.title || 'Unknown',
      category: track.genre || '在线',
      source: 'audius' as const,
      url: 'https://api.audius.co/v1/tracks/' + track.id + '/stream?app_name=video-agent',
      artist: track.user?.name || '',
      tags: (Array.isArray(track.tags) ? track.tags : String(track.tags || '').split(',')).filter(Boolean).slice(0, 6),
    }));
  } catch (e) {
    console.warn('[BGM] Audius search error:', e);
    return [];
  }
}

async function uploadBgm(file: File, name?: string): Promise<BgmItem> {
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    await fs.mkdir(bgmDir, { recursive: true });
    const ext = path.extname(file.name) || '.mp3';
    const safeName = (name || file.name).replace(/[^a-zA-Z0-9._\u4e00-\u9fff]/g, '_');
    const fileName = Date.now() + '_' + safeName + ext;
    const filePath = path.join(bgmDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    return { id: 'lib_' + fileName, name: name || file.name.replace(/\.[^.]+$/, ''), category: '自定义', source: 'library', url: '/bgm/library/' + fileName };
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const query = sp.get('q') || '';
    const source = sp.get('source') || 'all';
    const limit = Math.min(parseInt(sp.get('limit') || '20', 10), 50);
    const results: BgmItem[] = [];
    if (source === 'library' || source === 'all') results.push(...await listLibraryBgm());
    if (source === 'builtin' || source === 'all') results.push(...await listBuiltinBgm());
    if ((source === 'audius' || source === 'all') && query) { console.log('[BGM] Calling searchAudius for:', query); const audiusResults = await searchAudius(query, limit); console.log('[BGM] searchAudius returned:', audiusResults.length); results.push(...audiusResults); }
    return NextResponse.json({ success: true, data: results, total: results.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 });
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) return NextResponse.json({ error: '只支持 MP3/WAV/OGG 格式' }, { status: 400 });
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 });
      const bgmItem = await uploadBgm(file, name);
      return NextResponse.json({ success: true, data: bgmItem });
    }
    const { url, name } = await req.json();
    if (!url) return NextResponse.json({ error: '缺少下载链接' }, { status: 400 });
    const safeName = (name || 'bgm').replace(/[^a-zA-Z0-9._\u4e00-\u9fff]/g, '_');
    const fileName = Date.now() + '_' + safeName + '.mp3';
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    const filePath = path.join(bgmDir, fileName);
    await fs.mkdir(bgmDir, { recursive: true });
    const nodeFetch = (await import('node-fetch')).default;
    const resp = await nodeFetch(url);
    if (!resp.ok) return NextResponse.json({ error: '下载失败: ' + resp.status }, { status: 500 });
    const buffer = Buffer.from(await resp.buffer());
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ success: true, data: { url: '/bgm/library/' + fileName, fileName } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '下载失败' }, { status: 500 });
  }
}
