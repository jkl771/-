// ============================================
// 文件持久化存储
// ============================================

import type { ExtractedContent, PolishResult, VoiceConfig, AvatarConfig, VideoProject, CoverResult, PublishTask, Project } from './types';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readCollection<T>(name: string): Map<string, T> {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  ensureDir(DATA_DIR);
  if (!fs.existsSync(filePath)) return new Map();
  try {
    let text = fs.readFileSync(filePath, 'utf-8');
    // Strip BOM if present
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const raw = JSON.parse(text);
    return new Map(Object.entries(raw)) as Map<string, T>;
  } catch {
    return new Map();
  }
}

function writeCollection(name: string, map: Map<string, unknown>) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  ensureDir(DATA_DIR);
  const obj: Record<string, unknown> = {};
  map.forEach((v, k) => { obj[k] = v; });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
}

function makeStore<T>(name: string) {
  return {
    save(item: T & { id: string }) {
      const map = readCollection<T>(name);
      map.set(item.id, item);
      writeCollection(name, map as Map<string, unknown>);
    },
    get(id: string): T | undefined {
      return readCollection<T>(name).get(id);
    },
    delete(id: string): boolean {
      const map = readCollection<T>(name);
      const existed = map.has(id);
      map.delete(id);
      if (existed) writeCollection(name, map as Map<string, unknown>);
      return existed;
    },
    list(): T[] {
      return [...readCollection<T>(name).values()];
    },
  };
}

class FileStore {
  extracts = makeStore<ExtractedContent>('extracts');
  polishes = makeStore<PolishResult>('polishes');
  voices = makeStore<VoiceConfig>('voices');
  avatars = makeStore<AvatarConfig>('avatars');
  projects = makeStore<VideoProject>('projects');
  covers = makeStore<CoverResult>('covers');
  publishes = makeStore<PublishTask>('publishes');
  workflows = makeStore<Project>('workflows');
}

export const db = new FileStore();