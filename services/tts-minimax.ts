import fs from 'fs/promises';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';

function resolveApiKey(overrideKey?: string): string {
  if (overrideKey) return overrideKey;
  throw new Error('MiniMax requires API Key');
}

export const MINIMAX_VOICES: Record<string, { label: string; desc: string }> = {
  'male-qn-qingse': { label: '青涩青年（男）', desc: '清新自然' },
  'male-qn-jingying': { label: '精英青年（男）', desc: '专业干练' },
  'male-qn-badao': { label: '霸道青年（男）', desc: '强势有力' },
  'female-shaonv': { label: '元气少女（女）', desc: '活泼甜美' },
  'female-yujie': { label: '知性御姐（女）', desc: '成熟优雅' },
  'female-chengshu': { label: '温柔淑女（女）', desc: '温柔体贴' },
  'presenter_male': { label: '男主持人', desc: '专业播音' },
  'presenter_female': { label: '女主持人', desc: '专业播音' },
  'audiobook_male_1': { label: '有声书男声1', desc: '沉稳叙述' },
  'audiobook_female_1': { label: '有声书女声1', desc: '温暖叙述' },
};

export function listMinimaxVoices() {
  return Object.entries(MINIMAX_VOICES).map(([key, v]) => ({ key, ...v }));
}

export async function synthesizeMinimax(input: { text: string; voiceId?: string; apiKey?: string }): Promise<TTSResult> {
  const apiKey = resolveApiKey(input.apiKey);
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'minimax_' + id + '.mp3');
  const voice = input.voiceId || 'male-qn-qingse';

  console.log('[MiniMax] synth voice=' + voice);

  const r = await fetch('https://api.minimax.chat/v1/t2a_v2?GroupId=0', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'speech-02-hd', text: input.text, voice_id: voice, speed: 1, format: 'mp3' }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error('MiniMax synth failed: ' + r.status + ' ' + errText.slice(0, 300));
  }

  const data = await r.json() as any;
  const audioHex = data?.data?.audio;
  if (!audioHex) {
    const audioFile = data?.audio_file;
    if (audioFile) {
      const ar = await fetch(audioFile);
      if (!ar.ok) throw new Error('MiniMax download failed: ' + ar.status);
      await fs.writeFile(outputPath, Buffer.from(await ar.arrayBuffer()));
    } else {
      throw new Error('MiniMax returned no audio: ' + JSON.stringify(data).slice(0, 200));
    }
  } else {
    await fs.writeFile(outputPath, Buffer.from(audioHex, 'hex'));
  }

  return {
    id,
    audioUrl: '/api/output/videos/minimax_' + id + '.mp3',
    duration: input.text.replace(/\s/g, '').length / 4,
    voiceConfig: { id, name: 'minimax-' + voice, speed: 1, pitch: 0, pauseDuration: 300, emotion: 'neutral', createdAt: now() },
    createdAt: now(),
  };
}
