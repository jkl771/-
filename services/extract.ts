import { generateId, now, detectPlatform } from '@/lib/utils';
import type { ExtractedContent, ContentSegment } from '@/lib/types';
import { db } from '@/lib/db';
import { getASRService } from '@/lib/asr-service';
import path from 'path';
import fs from 'fs';

const MATERIALS_DIR = path.join(process.cwd(), 'materials');

export async function extractFromShareLink(shareText: string): Promise<ExtractedContent> {
  const id = generateId();
  const svc = getASRService();
  const resp = await svc.call({ action: 'extract', share_text: shareText });
  if (!resp.success) throw new Error(resp.error || '提取失败');
  const data = resp.data as Record<string, unknown>;
  // 验证结果有效性
  if (data.error) throw new Error(data.error as string);
  if (!data.text && !data.rawText) throw new Error('未能提取到任何文案内容，请检查链接是否有效');
  return buildResult(id, data);
}

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const id = generateId();
  const svc = getASRService();
  const resp = await svc.call({ action: 'extract', url });
  if (!resp.success) throw new Error(resp.error || '提取失败');
  const data = resp.data as Record<string, unknown>;
  // 验证结果有效性
  if (data.error) throw new Error(data.error as string);
  if (!data.text && !data.rawText) throw new Error('未能提取到任何文案内容，请检查链接是否有效');
  return buildResult(id, data);
}

export async function extractFromText(text: string): Promise<ExtractedContent> {
  const id = generateId();
  const sentences = text.split(/(?<=[。！？；\n])/g).map(s => s.trim()).filter(s => s.length > 0);
  const segments: ContentSegment[] = sentences.map(s => ({
    id: generateId(), text: s, type: 'narration' as const,
  }));
  const result: ExtractedContent = {
    id, url: '', platform: 'pasted', title: text.slice(0, 30), author: '未知作者',
    rawText: text, segments,
    metadata: { source: 'pasted', fetchedAt: now() },
    createdAt: now(),
  };
  db.extracts.save(result);
  return result;
}

export function getExtract(id: string): ExtractedContent | undefined { return db.extracts.get(id); }
export function listExtracts(): ExtractedContent[] {
  return db.extracts.list().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export function deleteExtract(id: string): boolean { return db.extracts.delete(id); }

export function checkDuplicate(shareText?: string, url?: string): Record<string, unknown> | null {
  if (!shareText && !url) return null;
  let targetUrl = url || '';
  if (shareText && !targetUrl) {
    const m = shareText.match(/https?:\/\/\S+/);
    targetUrl = m ? m[0] : '';
  }
  if (!targetUrl) return null;

  const videoIdMatch = targetUrl.match(/\/video\/(\d+)/);
  const targetVideoId = videoIdMatch ? videoIdMatch[1] : null;
  const shortMatch = targetUrl.match(/v\.douyin\.com\/(\w+)/);
  const targetShort = shortMatch ? shortMatch[1] : null;

  if (!fs.existsSync(MATERIALS_DIR)) return null;

  for (const matId of fs.readdirSync(MATERIALS_DIR)) {
    const infoPath = path.join(MATERIALS_DIR, matId, 'info.json');
    if (!fs.existsSync(infoPath)) continue;
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    const storedUrl = info.url || '';
    const storedOrig = info.original_url || '';

    if (storedUrl === targetUrl || storedOrig === targetUrl) return { ...info, id: matId };
    if (targetVideoId) {
      const m = storedUrl.match(/\/video\/(\d+)/);
      if (m && m[1] === targetVideoId) return { ...info, id: matId };
    }
    if (targetShort) {
      const m = (storedUrl + storedOrig).match(/v\.douyin\.com\/(\w+)/);
      if (m && m[1] === targetShort) return { ...info, id: matId };
    }
  }
  return null;
}

function buildResult(id: string, py: Record<string, unknown>): ExtractedContent {
  const rawSegs = py.segments as { text: string; start: number; end: number }[] | undefined;
  const segments: ContentSegment[] = [];
  if (rawSegs && Array.isArray(rawSegs)) {
    for (const s of rawSegs) {
      segments.push({ id: generateId(), text: s.text || '', startTime: s.start, endTime: s.end, type: 'narration' });
    }
  } else if (py.text) {
    for (const s of (py.text as string).split(/(?<=[。！？；\n])/g).map(x => x.trim()).filter(x => x)) {
      segments.push({ id: generateId(), text: s, type: 'narration' });
    }
  }

  const result: ExtractedContent = {
    id, url: (py.url as string) || '', platform: (py.platform as string) || '',
    title: (py.title as string) || '未知标题', author: (py.author as string) || '未知作者',
    rawText: (py.text as string) || '', segments,
    metadata: {
      source: (py.source as string) || 'unknown',
      duration: py.duration as number,
      platform: (py.platform as string) || '',
      platformRaw: (py.platform_raw as string) || '',
      materialId: (py.material_id as string) || '',
      tags: (py.tags as string[]) || [],
      mentions: (py.mentions as string[]) || [],
      hasTranscript: py.has_transcript as boolean,
      warning: py.warning as string,
      fetchedAt: now(),
    },
    createdAt: now(),
  };
  db.extracts.save(result);
  return result;
}
