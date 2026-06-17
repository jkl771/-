import { NextRequest, NextResponse } from 'next/server';
import { extractFromShareLink, extractFromUrl, extractFromText, getExtract, listExtracts, deleteExtract, checkDuplicate } from '@/services/extract';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shareText, url, text, mode, action } = body;

    // 按素材ID删除关联文案
    if (action === 'delete_by_material') {
      const all = listExtracts();
      for (const item of all) {
        if ((item.metadata as any)?.materialId === body.materialId) {
          deleteExtract(item.id);
        }
      }
      return NextResponse.json({ success: true });
    }

    // 删除操作
    if (action === 'delete') {
      const ok = deleteExtract(body.id);
      return NextResponse.json({ success: ok });
    }

    // 重复检测
    if (action === 'check_duplicate') {
      const dup = checkDuplicate(shareText, url);
      return NextResponse.json({ success: true, duplicate: dup });
    }

    let result;
    if (mode === 'share' || shareText) {
      if (!shareText) return NextResponse.json({ error: '请粘贴分享文本' }, { status: 400 });
      result = await extractFromShareLink(shareText);
    } else if (mode === 'url' || url) {
      if (!url) return NextResponse.json({ error: '请输入链接' }, { status: 400 });
      result = await extractFromUrl(url);
    } else if (mode === 'text' || text) {
      if (!text) return NextResponse.json({ error: '请输入文本' }, { status: 400 });
      result = await extractFromText(text);
    } else {
      return NextResponse.json({ error: '请提供 shareText、url 或 text' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '提取失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const q = searchParams.get('q')?.toLowerCase();

  if (id) {
    const item = getExtract(id);
    if (!item) return NextResponse.json({ error: '未找到' }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  }

  let items = listExtracts();
  if (q) {
    items = items.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.rawText || '').toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.platform || '').toLowerCase().includes(q)
    );
  }
  return NextResponse.json({ success: true, data: items });
}
