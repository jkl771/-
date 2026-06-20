import { NextRequest, NextResponse } from 'next/server';
import { classifyText } from '@/services/material-classifier';
import {
  getCandidates, addCandidates, removeCandidate, approveCandidate, approveAll,
  getApproved, getApprovedByStyle, getApprovedByScene, getHighQuality, getStats,
} from '@/services/material-store';
import {
  getCrawlerConfig, setCrawlerEnabled, testSource, fetchFromSource,
} from '@/services/material-crawler';

// GET: 查询素材库状态/候选/已批准/统计
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      return NextResponse.json({ success: true, data: getStats() });
    }
    if (action === 'candidates') {
      return NextResponse.json({ success: true, data: getCandidates() });
    }
    if (action === 'approved') {
      const style = searchParams.get('style');
      const scene = searchParams.get('scene');
      const hq = searchParams.get('high_quality');
      let data = getApproved();
      if (style) data = data.filter(m => m.tags.style.includes(style));
      if (scene) data = data.filter(m => m.tags.scene.includes(scene));
      if (hq === 'true') data = getHighQuality();
      return NextResponse.json({ success: true, data });
    }
    if (action === 'crawler') {
      return NextResponse.json({ success: true, data: getCrawlerConfig() });
    }
    if (action === 'classify') {
      const text = searchParams.get('text');
      if (!text) return NextResponse.json({ error: '缺少 text' }, { status: 400 });
      return NextResponse.json({ success: true, data: classifyText(text) });
    }

    return NextResponse.json({ success: true, data: { candidates: getCandidates().length, approved: getApproved().length } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '查询失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST: 添加素材/批准/批量操作/爬虫操作
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 添加素材到候选区
    if (body.action === 'add') {
      const texts: string[] = Array.isArray(body.texts) ? body.texts : [body.text];
      if (texts.length === 0) return NextResponse.json({ error: '缺少素材内容' }, { status: 400 });
      const result = addCandidates(texts, body.source || 'manual');
      return NextResponse.json({ success: true, data: result });
    }

    // 批量粘贴导入（自动按行分割）
    if (body.action === 'import') {
      const raw = body.text as string;
      if (!raw) return NextResponse.json({ error: '缺少文本' }, { status: 400 });
      const lines = raw.split(/\n/).map(l => l.trim()).filter(l => l.length >= 5);
      const result = addCandidates(lines, 'import');
      return NextResponse.json({ success: true, data: result, imported: lines.length });
    }

    // 批准单条
    if (body.action === 'approve') {
      const ok = approveCandidate(body.text);
      return NextResponse.json({ success: ok });
    }

    // 批量批准
    if (body.action === 'approve_all') {
      const count = approveAll();
      return NextResponse.json({ success: true, data: { approved: count } });
    }

    // 删除候选
    if (body.action === 'remove') {
      const result = removeCandidate(body.text);
      return NextResponse.json({ success: true, data: result });
    }

    // 爬虫开关
    if (body.action === 'crawler_toggle') {
      const cfg = setCrawlerEnabled(body.enabled);
      return NextResponse.json({ success: true, data: cfg });
    }

    // 测试爬虫源
    if (body.action === 'crawler_test') {
      const result = await testSource(body.sourceId);
      return NextResponse.json({ success: true, data: result });
    }

    // 从源抓取
    if (body.action === 'crawler_fetch') {
      const result = await fetchFromSource(body.sourceId);
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: '未知 action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
