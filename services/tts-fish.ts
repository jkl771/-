import fs from 'fs/promises';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';
import { getDecryptedFishAudioConfig } from '@/services/llm-config';

export async function listFishModels() {
  const cfg = getDecryptedFishAudioConfig();
  if (!cfg) return [];
  const r = await fetch(`${cfg.baseUrl}/model?page_size=50`, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
  if (!r.ok) return [];
  return r.json();
}

export async function cloneFishVoice(input: { name: string; samplePath: string }): Promise<{ voiceId: string }> {
  const cfg = getDecryptedFishAudioConfig();
  if (!cfg) throw new Error('Fish Audio 未配置');
  const form = new FormData();
  form.set('name', input.name);
  const buf = await fs.readFile(input.samplePath);
  form.set('audio', new Blob([buf]), path.basename(input.samplePath));
  const r = await fetch(`${cfg.baseUrl}/model`, { method: 'POST', headers: { Authorization: `Bearer ${cfg.apiKey}` }, body: form });
  if (!r.ok) throw new Error(`Fish clone failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return { voiceId: data.id || data.model_id || '' };
}

export async function synthesizeFish(input: { text: string; voiceId?: string }): Promise<TTSResult> {
  const cfg = getDecryptedFishAudioConfig();
  if (!cfg) throw new Error('Fish Audio 未配置');
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `fish_${id}.mp3`);

  const body: Record<string, unknown> = { text: input.text };
  if (input.voiceId) body.reference_id = input.voiceId;

  const r = await fetch(`${cfg.baseUrl}/tts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Fish TTS failed: ${r.status} ${await r.text()}`);
  const buffer = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(outputPath, buffer);

  return {
    id,
    audioUrl: `/api/output/videos/fish_${id}.mp3`,
    duration: (input.text.replace(/\s/g, '').length / 4),
    voiceConfig: { id, name: `fish-${input.voiceId || 'default'}`, speed: 1, pitch: 0, pauseDuration: 300, emotion: 'neutral', createdAt: now() },
    createdAt: now(),
  };
}
