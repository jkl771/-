import { generateId, now } from '@/lib/utils';
import type { VoiceConfig, TTSRequest, TTSResult } from '@/lib/types';
import { db } from '@/lib/db';
import { synthesizeEdge } from '@/services/tts-edge';
import { synthesizeFish, cloneFishVoice, listFishModels } from '@/services/tts-fish';
import { synthesizeCosyVoice, cloneCosyVoice } from '@/services/tts-cosyvoice';
import { synthesizeCustom } from '@/services/tts-custom';

export async function saveVoiceConfig(cfg: Omit<VoiceConfig, 'id' | 'createdAt'>): Promise<VoiceConfig> {
  const voice: VoiceConfig = { id: generateId(), ...cfg, createdAt: now() };
  db.voices.save(voice);
  return voice;
}

export function listVoiceConfigs(): VoiceConfig[] {
  return db.voices.list();
}

export async function synthesizeSpeech(input: { text: string; source: 'local_edge' | 'fish' | 'cosyvoice' | 'custom'; voiceId?: string; speed?: number; custom?: { baseUrl?: string; apiKey?: string; model?: string; voice?: string } }): Promise<TTSResult> {
  if (input.source === 'local_edge') return synthesizeEdge({ text: input.text, voiceKey: input.voiceId, speed: input.speed });
  if (input.source === 'fish') return synthesizeFish({ text: input.text, voiceId: input.voiceId });
  if (input.source === 'cosyvoice') return synthesizeCosyVoice({ text: input.text, voiceId: input.voiceId });
  if (input.source === 'custom') {
    const c = input.custom || {};
    if (!c.baseUrl || !c.apiKey) throw new Error('自定义 TTS 需要 baseUrl 和 apiKey');
    return synthesizeCustom({ text: input.text, baseUrl: c.baseUrl, apiKey: c.apiKey, model: c.model, voice: c.voice, speed: input.speed });
  }
  throw new Error(`未知 source: ${input.source}`);
}

export async function cloneVoice(input: { source: 'fish' | 'cosyvoice'; name: string; samplePath: string }): Promise<{ voiceId: string }> {
  if (input.source === 'fish') return cloneFishVoice({ name: input.name, samplePath: input.samplePath });
  if (input.source === 'cosyvoice') return cloneCosyVoice({ name: input.name, samplePath: input.samplePath });
  throw new Error(`未知 clone source: ${input.source}`);
}

export async function listVoices(input: { source: 'local_edge' | 'fish' | 'cosyvoice' | 'custom' }): Promise<unknown[]> {
  if (input.source === 'fish') return listFishModels();
  return [];
}
