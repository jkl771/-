import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';

const PYTHON = process.env.XTTS_PYTHON || path.join(process.cwd(), 'tools', 'python311', 'python.exe');
const RUNNER = path.join(process.cwd(), 'services', 'xtts_runner.py');

function runPython(args: string[], timeoutMs = 300000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, [RUNNER, ...args], {
    cwd: process.cwd(),
    timeout: timeoutMs,
    env: { ...process.env, COQUI_TOS_AGREED: '1', HF_ENDPOINT: 'https://hf-mirror.com' },
  });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `XTTS exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

export async function probeXtts(): Promise<{ available: boolean; device?: string; gpu?: boolean; latencyMs?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const { stdout } = await runPython(['probe'], 30000);
    const last = stdout.trim().split('\n').pop() || '{}';
    const r = JSON.parse(last);
    if (r.status === 'ok') {
      return { available: true, device: r.device, gpu: r.gpu, latencyMs: Date.now() - t0 };
    }
    return { available: false, error: r.error || 'probe failed' };
  } catch (e: any) {
    return { available: false, error: e.message, latencyMs: Date.now() - t0 };
  }
}

export interface XTTSResult {
  id: string;
  audioUrl: string;
  duration: number;
  device: string;
  elapsedSec: number;
  createdAt: string;
}

export async function synthesizeXtts(input: {
  text: string;
  speakerWav?: string;
  lang?: string;
  speed?: number;
}): Promise<XTTSResult> {
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `xtts_${id}.wav`);

  const args = ['synth', '--text', input.text, '--output', outputPath, '--lang', input.lang || 'zh', '--speed', String(input.speed ?? 1.0)];
  if (input.speakerWav) {
    // 支持逗号分隔的多段路径
    const paths = input.speakerWav.split(',').map(p => p.trim()).filter(p => p && fs.existsSync(p));
    if (paths.length > 0) args.push('--speaker_wav', paths.join(','));
  }

  const { stdout } = await runPython(args);
  const last = stdout.trim().split('\n').pop() || '{}';
  const r = JSON.parse(last);
  if (r.status !== 'ok') throw new Error(r.error || 'XTTS synthesis failed');

  const mp3Path = outputPath.replace('.wav', '.mp3');
  try {
    const ffmpeg = spawn('ffmpeg', ['-y', '-i', outputPath, '-codec:a', 'libmp3lame', '-qscale:a', '2', mp3Path]);
    await new Promise<void>((resolve, reject) => {
      ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error('ffmpeg failed')));
      ffmpeg.on('error', reject);
    });
    fs.unlinkSync(outputPath);
  } catch {
    return { id, audioUrl: `/api/output/videos/xtts_${id}.wav`, duration: (input.text.replace(/\s/g, '').length / 4) / (input.speed || 1), device: r.device, elapsedSec: r.elapsed_sec, createdAt: now() };
  }

  return {
    id,
    audioUrl: `/api/output/videos/xtts_${id}.mp3`,
    duration: (input.text.replace(/\s/g, '').length / 4) / (input.speed || 1),
    device: r.device,
    elapsedSec: r.elapsed_sec,
    createdAt: now(),
  };
}
export async function cloneXttsSpeaker(input: { name: string; samplePath: string }): Promise<{ voiceId: string }> {
  // 本地 XTTS 无需注册音色，直接把样本路径作为 voiceId
  const voiceId = input.samplePath;
  return { voiceId };
}

