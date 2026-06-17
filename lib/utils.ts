// ============================================
// 工具函数
// ============================================

import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function now(): string {
  return new Date().toISOString();
}

/** 检测 URL 属于哪个平台 */
export function detectPlatform(url: string): string {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes('douyin') || host.includes('tiktok')) return 'douyin';
  if (host.includes('kuaishou')) return 'kuaishou';
  if (host.includes('bilibili')) return 'bilibili';
  if (host.includes('xiaohongshu') || host.includes('xhslink')) return 'xiaohongshu';
  if (host.includes('weixin') || host.includes('wx')) return 'wechat_video';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('twitter') || host.includes('x.com')) return 'twitter';
  return 'generic';
}

/** 文本相似度计算（简易 Jaccard） */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/** 中文分句 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？；\n])/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/** 秒数转 SRT 时间格式 */
export function secondsToSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

/** 生成 SRT 字幕文件内容 */
export function generateSrt(subtitles: { text: string; startTime: number; endTime: number }[]): string {
  return subtitles
    .map((sub, i) => {
      return `${i + 1}\n${secondsToSrtTime(sub.startTime)} --> ${secondsToSrtTime(sub.endTime)}\n${sub.text}\n`;
    })
    .join('\n');
}

/** 估算中文文本朗读时长（秒），约 4 字/秒 */
export function estimateDuration(text: string): number {
  const charCount = text.replace(/\s/g, '').length;
  return charCount / 4;
}

/** 安全 JSON 解析 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
