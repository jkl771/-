import { NextRequest, NextResponse } from 'next/server';
import { polishContent } from '@/services/polish';
import { getDecryptedLLMConfig } from '@/services/llm-config';
import { loadMaterialsConfig, saveMaterialsConfig } from '@/config/polish-materials';

export async function GET() {
  try {
    const cfg = loadMaterialsConfig();
    return NextResponse.json({ success: true, data: cfg });
  } catch (error) {
    const message = error instanceof Error ? error.message : '读取素材库失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'set_active') {
      const cfg = loadMaterialsConfig();
      if (!cfg.versions.find(v => v.id === body.versionId)) {
        return NextResponse.json({ error: '版本不存在' }, { status: 404 });
      }
      cfg.activeVersionId = body.versionId;
      saveMaterialsConfig(cfg);
      return NextResponse.json({ success: true, data: cfg });
    }

    if (body.action === 'fetch_remote') {
      const url = body.url as string;
      if (!url) return NextResponse.json({ error: '缺少 url' }, { status: 400 });
      const res = await fetch(url);
      if (!res.ok) return NextResponse.json({ error: `拉取失败: ${res.status}` }, { status: 502 });
      const json = await res.json();
      const items: string[] = Array.isArray(json.items) ? json.items.map((x: unknown) => String(x)) : [];
      const name: string = json.name ? String(json.name) : '远程素材';
      if (items.length === 0) return NextResponse.json({ error: '远程素材为空' }, { status: 422 });
      const cfg = loadMaterialsConfig();
      const id = `remote-${Date.now()}`;
      cfg.versions.unshift({ id, name, source: 'remote', sourceUrl: url, createdAt: new Date().toISOString(), items });
      cfg.activeVersionId = id;
      saveMaterialsConfig(cfg);
      return NextResponse.json({ success: true, data: cfg });
    }

    return NextResponse.json({ error: '未知 action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新素材库失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, style = 'casual', mode = 'rewrite', targetLength, llmConfig } = body;

    if (!text) {
      return NextResponse.json({ error: '请提供 text 参数' }, { status: 400 });
    }

    // ?????????????????????
    const serverConfig = getDecryptedLLMConfig();
    const finalConfig = body.useAI && serverConfig ? serverConfig : llmConfig;
    const result = await polishContent({ text, style, mode, targetLength, ...(finalConfig ? { llmConfig: finalConfig } : {}) } as any);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '润色失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
