import fs from 'fs/promises';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';

export async function synthesizeCustom(input: { text: string; baseUrl: string; apiKey: string; model?: string; voice?: string; speed?: number }): Promise<TTSResult> {
  if (!input.baseUrl || !input.apiKey) throw new Error('自定义 TTS 需要 baseUrl 和 apiKey');
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `custom_${id}.mp3`);

  const url = `${input.baseUrl.replace(/\/$/, '')}/audio/speech`;
  let r: Response;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${input.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: input.model || 'tts-1', input: input.text, voice: input.voice || 'alloy', speed: input.speed || 1, response_format: 'mp3' }),
    });
  } catch (err) {
    throw new Error(`自定义 TTS 网络错误: ${err instanceof Error ? err.message : String(err)} (url=${url})`);
  }

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`自定义 TTS 失败: HTTP ${r.status} ${body.slice(0, 200)} (url=${url})`);
  }

  const buffer = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(outputPath, buffer);

  return {
    id,
    audioUrl: `/api/output/videos/custom_${id}.mp3`,
    duration: (input.text.replace(/\s/g, '').length / 4) / (input.speed || 1),
    voiceConfig: { id, name: `custom-${input.model || 'tts-1'}`, speed: input.speed || 1, pitch: 0, pauseDuration: 300, emotion: 'neutral', createdAt: now() },
    createdAt: now(),
  };
}
