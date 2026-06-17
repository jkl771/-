import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { TTSResult } from '@/lib/types';

const VOICE_PRESETS: Record<string, string> = {
  xiaoxiao: 'zh-CN-XiaoxiaoNeural',
  yunxi: 'zh-CN-YunxiNeural',
  yunyang: 'zh-CN-YunyangNeural',
  xiaoyi: 'zh-CN-XiaoyiNeural',
  xiaoxuan: 'zh-CN-XiaoxuanNeural',
  yunjian: 'zh-CN-YunjianNeural',
  hiugaai: 'zh-HK-HiuGaaiNeural',
  hiumaan: 'zh-HK-HiuMaanNeural',
  wanlung: 'zh-HK-WanLungNeural',
};

const VOICE_META: Record<string, { label: string; desc: string; gender: string; style: string }> = {
  xiaoxiao: { label: '晓晓（女·温柔自然）', desc: '适合日常解说、轻快旁白', gender: 'female', style: '温柔' },
  yunxi: { label: '云希（男·年轻活力）', desc: '适合短视频、活泼口播', gender: 'male', style: '活力' },
  yunyang: { label: '云扬（男·专业播音）', desc: '适合新闻播报、正式场景', gender: 'male', style: '专业' },
  xiaoyi: { label: '晓艺（女·甜美可爱）', desc: '适合电商、轻松带货', gender: 'female', style: '甜美' },
  xiaoxuan: { label: '晓萱（女·活泼开朗）', desc: '适合综艺感、年轻化内容', gender: 'female', style: '活泼' },
  yunjian: { label: '云健（男·沉稳有力）', desc: '适合纪录片、深度讲解', gender: 'male', style: '沉稳' },
  hiugaai: { label: '曉佳（女·粤语）', desc: '粤语女声，适合本地化内容', gender: 'female', style: '粤语' },
  hiumaan: { label: '曉敏（女·粤语）', desc: '粤语女声，温柔稳重', gender: 'female', style: '粤语' },
  wanlung: { label: '雲龍（男·粤语）', desc: '粤语男声，正式叙述', gender: 'male', style: '粤语' },
};

const EMOTION_PRESETS: Record<string, { pitch: string; rate: string; volume: string }> = {
  neutral:  { pitch: '+0Hz',  rate: '+0%',  volume: '+0%' },
  cheerful: { pitch: '+15Hz', rate: '+10%', volume: '+5%' },
  serious:  { pitch: '-10Hz', rate: '-5%',  volume: '-3%' },
  gentle:   { pitch: '+8Hz',  rate: '-8%',  volume: '-5%' },
  sad:      { pitch: '-15Hz', rate: '-15%', volume: '-10%' },
  angry:    { pitch: '+5Hz',  rate: '+15%', volume: '+15%' },
  warm:     { pitch: '+5Hz',  rate: '-3%',  volume: '+3%' },
  dramatic: { pitch: '+10Hz', rate: '+5%',  volume: '+10%' },
};

export function listEdgeVoicePresets() {
  return Object.entries(VOICE_PRESETS).map(([key, voice]) => ({
    key,
    voice,
    type: 'basic',
    ...(VOICE_META[key] || { label: key, desc: '', gender: 'unknown', style: '默认' }),
  }));
}

export function listEmotionPresets() {
  return Object.entries(EMOTION_PRESETS).map(([key, v]) => ({ key, ...v }));
}

export async function synthesizeEdge(input: {
  text: string;
  voiceKey?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
  bgmFile?: string;
  bgmVolume?: number;
}): Promise<TTSResult> {
  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });
  const rawFileName = 'edge_' + id + '.mp3';
  const rawPath = path.join(outputDir, rawFileName);
  const finalFileName = 'edge_' + id + '_final.mp3';
  const finalPath = path.join(outputDir, finalFileName);

  const voice = VOICE_PRESETS[input.voiceKey || 'xiaoxiao'] || VOICE_PRESETS.xiaoxiao;

  const speedRate = input.speed && input.speed !== 1 ? Math.round((input.speed - 1) * 100) : 0;
  const rate = (speedRate >= 0 ? '+' : '') + speedRate + '%';

  const emotion = EMOTION_PRESETS[input.emotion || 'neutral'] || EMOTION_PRESETS.neutral;
  const userPitch = input.pitch || 0;
  const emotionPitchHz = parseInt(emotion.pitch) || 0;
  const totalPitchHz = emotionPitchHz + userPitch;
  const pitch = (totalPitchHz >= 0 ? '+' : '') + totalPitchHz + 'Hz';

  const emotionRatePct = parseInt(emotion.rate) || 0;
  const totalRate = speedRate + emotionRatePct;
  const finalRate = (totalRate >= 0 ? '+' : '') + totalRate + '%';
  const finalVolume = emotion.volume;

  const scriptPath = path.join(process.cwd(), 'services', 'edge_tts_runner.py');
  const tmpTextPath = path.join(config.video.outputDir, 'edge_text_' + id + '.txt');
  await fs.writeFile(tmpTextPath, input.text, 'utf-8');
  const cmd = `python "${scriptPath}" --text-file "${tmpTextPath}" --voice ${voice} --output "${rawPath}" --rate "${finalRate}" --pitch "${pitch}" --volume "${finalVolume}"`;
  console.log('[Edge TTS] running:', cmd.slice(0, 200));
  try {
    execSync(cmd, { timeout: 30000, stdio: 'pipe', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  } finally {
    await fs.unlink(tmpTextPath).catch(() => {});
  }

  const stat = await fs.stat(rawPath);
  if (stat.size < 100) throw new Error('Edge TTS returned empty file');

  let outputUrl = '/api/output/videos/' + rawFileName;
  if (input.bgmFile) {
    const bgmVol = input.bgmVolume ?? 0.3;
    const voiceVol = 1.6;
    const ffmpegCmd = `ffmpeg -y -i "${rawPath}" -i "${input.bgmFile}" -filter_complex "[0:a]volume=${voiceVol}[v];[1:a]volume=${bgmVol * 30},aloop=loop=-1:size=2e+09[b];[v][b]amix=inputs=2:duration=shortest:dropout_transition=0:normalize=0" -t ${Math.ceil(stat.size / 4000) + 2} "${finalPath}"`;
    console.log('[Edge TTS] mixing BGM:', ffmpegCmd.slice(0, 200));
    try {
      execSync(ffmpegCmd, { timeout: 30000, stdio: 'pipe' });
      const finalStat = await fs.stat(finalPath);
      if (finalStat.size > 100) {
        outputUrl = '/api/output/videos/' + finalFileName;
      }
    } catch (e) {
      console.warn('[Edge TTS] BGM mix failed, using raw audio:', e);
    }
  }

  return {
    id,
    audioUrl: outputUrl,
    duration: (input.text.replace(/\s/g, '').length / 4) / (input.speed || 1),
    voiceConfig: {
      id, name: 'edge-' + voice,
      speed: input.speed || 1, pitch: userPitch,
      pauseDuration: 300, emotion: input.emotion || 'neutral',
      createdAt: now(),
    },
    createdAt: now(),
  } as TTSResult;
}

