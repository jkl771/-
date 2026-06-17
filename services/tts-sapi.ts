import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';

const SAPI_SCRIPT = path.join(process.cwd(), 'services', 'sapi-tts.ps1');

const SAPI_VOICES: Record<string, string> = {
  huihui: 'Microsoft Huihui Desktop',
  zira: 'Microsoft Zira Desktop',
};

export function listSapiVoices() {
  return Object.entries(SAPI_VOICES).map(([key, name]) => ({ key, name }));
}

export async function synthesizeSapi(input: { text: string; voiceKey?: string }): Promise<TTSResult> {
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const fileName = `sapi_${id}.wav`;
  const outputPath = path.join(outputDir, fileName);
  const voice = SAPI_VOICES[input.voiceKey || 'huihui'] || SAPI_VOICES.huihui;

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('powershell', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', SAPI_SCRIPT,
      '-Text', input.text,
      '-Voice', voice,
      '-OutputPath', outputPath,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    proc.stderr?.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`SAPI TTS failed (code ${code}): ${stderr.slice(0, 200)}`));
    });
    proc.on('error', (e) => reject(e));

    setTimeout(() => { try { proc.kill(); } catch {} reject(new Error('SAPI TTS timeout')); }, 15000);
  });

  const stat = await fs.stat(outputPath);
  if (stat.size === 0) throw new Error('SAPI TTS 输出文件为空');

  const duration = input.text.replace(/\s/g, '').length / 4;

  return {
    id,
    audioUrl: `/api/output/videos/${fileName}`,
    duration,
    voiceConfig: { id, name: `sapi-${voice}`, speed: 1, pitch: 0, pauseDuration: 300, emotion: 'neutral', createdAt: now() },
    createdAt: now(),
  };
}