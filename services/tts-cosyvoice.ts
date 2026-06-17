import fs from 'fs/promises';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';
import { getDecryptedCosyVoiceConfig } from '@/services/llm-config';

export const COSYVOICE_PRESETS: Record<string, { label: string; desc: string }> = {
  longanyang: { label: '龙阳（男·沉稳磁性）', desc: '适合新闻、旁白、有声书' },
  longxiaoxia: { label: '龙小夏（女·甜美活泼）', desc: '适合短视频、直播' },
  longxiaobai: { label: '龙小白（男·清新自然）', desc: '适合日常对话、客服' },
  longxiaochun: { label: '龙小春（女·温柔知性）', desc: '适合情感类、治愈系' },
  longlaotie: { label: '龙老铁（男·东北豪爽）', desc: '适合搞笑、方言类' },
  longyue: { label: '龙悦（女·优雅大方）', desc: '适合正式场合、企业宣传' },
  longshu: { label: '龙书（男·儒雅书生）', desc: '适合文化类、教育类' },
  longcheng: { label: '龙诚（男·成熟稳重）', desc: '适合商业播报、广告' },
  longwan: { label: '龙婉（女·温婉动人）', desc: '适合情感、故事类' },
};

export function listCosyVoicePresets() {
  return Object.entries(COSYVOICE_PRESETS).map(([key, v]) => ({ key, ...v }));
}

function resolveApiKey(overrideKey?: string): { baseUrl: string; apiKey: string } {
  if (overrideKey) return { baseUrl: 'https://dashscope.aliyuncs.com/api/v1', apiKey: overrideKey };
  const cfg = getDecryptedCosyVoiceConfig();
  if (!cfg) throw new Error('CosyVoice not configured');
  return cfg;
}

export async function cloneCosyVoice(input: { name: string; samplePath: string; apiKey?: string }): Promise<{ voiceId: string }> {
  const { baseUrl, apiKey } = resolveApiKey(input.apiKey);
  const buf = await fs.readFile(input.samplePath);
  const ext = path.extname(input.samplePath).toLowerCase();
  const mimeMap: Record<string, string> = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.flac': 'audio/flac' };
  const mime = mimeMap[ext] || 'audio/mpeg';
  const dataUri = 'data:' + mime + ';base64,' + buf.toString('base64');
  const prefix = (input.name || 'uservoice').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'uservoice';
  const reqUrl = baseUrl + '/services/audio/tts/customization';
  console.log('[CosyVoice] clone POST', reqUrl, 'prefix=' + prefix);
  const r = await fetch(reqUrl, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'voice-enrollment', input: { action: 'create_voice', target_model: 'cosyvoice-v3-flash', prefix, url: dataUri } }),
  });
  if (!r.ok) { const errText = await r.text().catch(() => ''); throw new Error('CosyVoice clone failed: ' + r.status + ' ' + errText.slice(0, 300)); }
  const data = await r.json() as any;
  const voiceId = data?.output?.voice_id;
  if (!voiceId) throw new Error('CosyVoice clone returned no voice_id');
  return { voiceId };
}

export async function synthesizeCosyVoice(input: { text: string; voiceId?: string; apiKey?: string; model?: string }): Promise<TTSResult> {
  const { baseUrl, apiKey } = resolveApiKey(input.apiKey);
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'cosy_' + id + '.mp3');
  const voice = input.voiceId || 'longanyang';
  let model = input.model || 'cosyvoice-v3-flash';
  if (voice.includes('myvoice') || voice.startsWith('cosyvoice-v3-flash-myvoice')) model = 'cosyvoice-v3-flash';
  const reqUrl = baseUrl + '/services/audio/tts/SpeechSynthesizer';
  console.log('[CosyVoice] synth POST', reqUrl, 'model=' + model, 'voice=' + voice);
  const raw = String(input.text || '').replace(/\s+/g, ' ').trim();
  const chunks = raw.length > 180 ? raw.match(/.{1,180}[。！？!?.\n]?|.{1,180}/gs) || [raw] : [raw];
  const tmpFiles: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const seg = chunks[i];
    const r = await fetch(reqUrl, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: { text: seg }, parameters: { voice, format: 'mp3', sample_rate: 24000 } }),
    });
    if (!r.ok) { const errText = await r.text().catch(() => ''); throw new Error('CosyVoice synth failed: ' + r.status + ' ' + errText.slice(0, 300)); }
    const data = await r.json();
    const audioUrl = data?.output?.audio?.url || data?.output?.audio || data?.audio;
    if (!audioUrl) throw new Error('CosyVoice returned no audio URL');
    const ar = await fetch(audioUrl);
    if (!ar.ok) throw new Error('CosyVoice download failed: ' + ar.status);
    const tmp = path.join(outputDir, 'cosy_' + id + '_' + i + '.mp3');
    await fs.writeFile(tmp, Buffer.from(await ar.arrayBuffer()));
    tmpFiles.push(tmp);
  }
  if (tmpFiles.length === 1) {
    await fs.rename(tmpFiles[0], outputPath);
  } else {
    const ffmpeg = (await import('fluent-ffmpeg') as any).default ?? (await import('fluent-ffmpeg'));
    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg();
      tmpFiles.forEach(f => cmd.input(f));
      cmd.on('error', reject).on('end', resolve).mergeToFile(outputPath, outputDir);
    });
  }
  return {
    id,
    audioUrl: '/api/output/videos/cosy_' + id + '.mp3',
    duration: input.text.replace(/\s/g, '').length / 4,
    voiceConfig: { id, name: 'cosy-' + voice, speed: 1, pitch: 0, pauseDuration: 300, emotion: 'neutral', createdAt: now() },
    createdAt: now(),
  };
}
