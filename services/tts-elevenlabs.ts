import fs from 'fs/promises';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';

export const ELEVENLABS_VOICES: Record<string, { label: string; desc: string }> = {
  'JBFqnCBsd6RMkjVDRZzb': { label: 'George（男·英式绅士）', desc: '沉稳温暖，适合旁白' },
  '21m00Tcm4TlvDq8ikWAM': { label: 'Rachel（女·美式温柔）', desc: '自然流畅，适合有声书' },
  'AZnzlk1XvdvUeBnXmlld': { label: 'Domi（女·活力自信）', desc: '充满能量，适合广告' },
  'EXAVITQu4vr4xnSDxMaL': { label: 'Bella（女·柔和甜美）', desc: '轻柔悦耳，适合治愈系' },
  'ErXwobaYiN019PkySvjV': { label: 'Antoni（男·磁性低沉）', desc: '成熟稳重，适合纪录片' },
  'MF3mGyEYCl7XYWbV9V6O': { label: 'Elli（女·年轻清新）', desc: '青春活力' },
  'TxGEqnHWrfWFTfGW9XjX': { label: 'Josh（男·浑厚有力）', desc: '适合预告片、广告' },
  'VR6AewLTigWG4xSOukaG': { label: 'Arnold（男·硬朗阳刚）', desc: '力量感强' },
  'pNInz6obpgDQGcFmaJgB': { label: 'Adam（男·深沉稳重）', desc: '适合新闻、播报' },
  'yoZ06aMxZJJ28mfd3POQ': { label: 'Sam（男·沙哑粗犷）', desc: '有故事感' },
};

export function listElevenLabsVoices() {
  return Object.entries(ELEVENLABS_VOICES).map(([key, v]) => ({ key, ...v }));
}

export async function cloneElevenLabsVoice(input: { name: string; samplePath: string; apiKey: string }): Promise<{ voiceId: string }> {
  const buf = await fs.readFile(input.samplePath);
  const blob = new Blob([buf], { type: 'audio/mpeg' });
  const form = new FormData();
  form.set('name', input.name || 'My Voice');
  form.set('files', blob, 'sample.mp3');

  const r = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: { 'xi-api-key': input.apiKey },
    body: form,
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error('ElevenLabs clone failed: ' + r.status + ' ' + errText.slice(0, 300));
  }

  const data = await r.json() as any;
  const voiceId = data?.voice_id;
  if (!voiceId) throw new Error('ElevenLabs clone returned no voice_id');
  return { voiceId };
}

export async function synthesizeElevenLabs(input: { text: string; voiceId?: string; apiKey: string }): Promise<TTSResult> {
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'el_' + id + '.mp3');
  const voice = input.voiceId || 'JBFqnCBsd6RMkjVDRZzb';

  console.log('[ElevenLabs] synth voice=' + voice);

  const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voice, {
    method: 'POST',
    headers: { 'xi-api-key': input.apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({
      text: input.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error('ElevenLabs synth failed: ' + r.status + ' ' + errText.slice(0, 300));
  }

  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 100) throw new Error('ElevenLabs returned empty audio');
  await fs.writeFile(outputPath, buf);

  return {
    id,
    audioUrl: '/api/output/videos/el_' + id + '.mp3',
    duration: input.text.replace(/\s/g, '').length / 4,
    voiceConfig: { id, name: 'elevenlabs-' + voice, speed: 1, pitch: 0, pauseDuration: 300, emotion: 'neutral', createdAt: now() },
    createdAt: now(),
  };
}

export async function getElevenLabsQuota(apiKey: string): Promise<{ remaining: number; limit: number; reset: string } | null> {
  try {
    const r = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey },
    });
    if (!r.ok) return null;
    const data = await r.json() as any;
    return {
      remaining: data?.character_count ? data.subscription?.character_limit - data.character_count : 0,
      limit: data?.subscription?.character_limit || 0,
      reset: data?.subscription?.next_character_count_reset_unix ? new Date(data.subscription.next_character_count_reset_unix * 1000).toLocaleDateString() : '',
    };
  } catch { return null; }
}
