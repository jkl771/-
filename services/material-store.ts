// ============================================
// 素材候选区 + 质量分 + 去重 + 入库
// ============================================

import fs from 'fs';
import path from 'path';
import { classifyText, type ClassifiedMaterial, type MaterialTags } from './material-classifier';

const DATA_DIR = path.join(process.cwd(), 'data');
const CANDIDATES_PATH = path.join(DATA_DIR, 'material_candidates.json');
const APPROVED_PATH = path.join(DATA_DIR, 'material_approved.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJson<T>(filePath: string, fallback: T): T {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(filePath)) return fallback;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return fallback; }
}

function saveJson(filePath: string, data: unknown) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ========== 候选区 ==========

export function getCandidates(): ClassifiedMaterial[] {
  return loadJson<ClassifiedMaterial[]>(CANDIDATES_PATH, []);
}

export function addCandidates(texts: string[], source: 'manual' | 'crawler' | 'import' = 'manual'): ClassifiedMaterial[] {
  const existing = getCandidates();
  const existingTexts = new Set(existing.map(c => c.text));
  const now = new Date().toISOString();

  const newItems: ClassifiedMaterial[] = [];
  for (const text of texts) {
    const trimmed = text.trim();
    if (!trimmed || existingTexts.has(trimmed)) continue;
    
    const tags = classifyText(trimmed);
    // 质量分低于 50 的直接拒绝
    if (tags.quality < 50) continue;
    
    newItems.push({
      text: trimmed,
      tags,
      addedAt: now,
      source,
      status: 'candidate',
    });
    existingTexts.add(trimmed);
  }

  const updated = [...existing, ...newItems];
  saveJson(CANDIDATES_PATH, updated);
  return updated;
}

export function removeCandidate(text: string): ClassifiedMaterial[] {
  const candidates = getCandidates().filter(c => c.text !== text);
  saveJson(CANDIDATES_PATH, candidates);
  return candidates;
}

// ========== 已批准库 ==========

export function getApproved(): ClassifiedMaterial[] {
  return loadJson<ClassifiedMaterial[]>(APPROVED_PATH, []);
}

/** 将候选素材批准入库（按标签分类存储） */
export function approveCandidate(text: string): boolean {
  const candidates = getCandidates();
  const idx = candidates.findIndex(c => c.text === text);
  if (idx === -1) return false;

  const item = candidates[idx];
  item.status = 'approved';
  candidates.splice(idx, 1);

  const approved = getApproved();
  approved.push(item);

  saveJson(CANDIDATES_PATH, candidates);
  saveJson(APPROVED_PATH, approved);
  return true;
}

/** 批量批准所有候选 */
export function approveAll(): number {
  const candidates = getCandidates();
  const approved = getApproved();
  const now = new Date().toISOString();

  for (const c of candidates) {
    c.status = 'approved';
    approved.push(c);
  }

  saveJson(CANDIDATES_PATH, []);
  saveJson(APPROVED_PATH, approved);
  return candidates.length;
}

// ========== 按标签检索素材 ==========

export function getApprovedByStyle(style: string): ClassifiedMaterial[] {
  return getApproved().filter(m => m.tags.style.includes(style));
}

export function getApprovedByScene(scene: string): ClassifiedMaterial[] {
  return getApproved().filter(m => m.tags.scene.includes(scene));
}

export function getApprovedByEmotion(emotion: string): ClassifiedMaterial[] {
  return getApproved().filter(m => m.tags.emotion.includes(emotion));
}

/** 获取高质量素材（质量分 >= 70） */
export function getHighQuality(): ClassifiedMaterial[] {
  return getApproved().filter(m => m.tags.quality >= 70);
}

// ========== 简易去重（Jaccard） ==========

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/** 检查文本是否与已有素材重复 */
export function isDuplicate(text: string, threshold = 0.8): boolean {
  const approved = getApproved();
  return approved.some(m => jaccardSimilarity(m.text, text) >= threshold);
}

// ========== 统计 ==========

export function getStats() {
  const candidates = getCandidates();
  const approved = getApproved();
  const byStyle: Record<string, number> = {};
  const byScene: Record<string, number> = {};

  for (const m of approved) {
    for (const s of m.tags.style) byStyle[s] = (byStyle[s] || 0) + 1;
    for (const s of m.tags.scene) byScene[s] = (byScene[s] || 0) + 1;
  }

  return {
    candidates: candidates.length,
    approved: approved.length,
    byStyle,
    byScene,
  };
}
