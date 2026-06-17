// ============================================
// 阿里云 VideoRetalk 真人视频改口型服务
// 文档: https://help.aliyun.com/zh/model-studio/videoretalk/
// ============================================

import fs from 'fs/promises';
import path from 'path';
import { generateId, now } from '@/lib/utils';
import { config } from '@/config';

const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/api/v1';
const MODEL_NAME = 'videoretalk';
const PRICE_PER_SEC = 0.08; // 元/秒
const FREE_QUOTA_SEC = 1800; // 免费额度秒数

export interface RetalkResult {
  id: string;
  videoUrl: string;
  durationSec: number;
  estimatedCost: number;
  createdAt: string;
}

/** 获取 API Key（优先用户配置的，其次环境变量） */
export function getRetalkApiKey(): string | null {
  // 1. 用户在 avatar 页面配置的 Key
  const userKey = getStoredRetalkKey();
  if (userKey) return userKey;
  // 2. 复用 TTS 页配置的 DashScope Key
  const ttsKey = getStoredTtsKey();
  if (ttsKey) return ttsKey;
  // 3. 环境变量
  return process.env.DASHSCOPE_API_KEY || null;
}

/** 从 TTS 加密文件读取 DashScope Key */
function getStoredTtsKey(): string | null {
  const fsSync = require('fs');
  const keyFile = path.join(process.cwd(), 'data', 'tts-key.enc');
  const saltFile = path.join(process.cwd(), 'data', 'tts-key.salt');
  if (!fsSync.existsSync(keyFile)) return null;
  try {
    const crypto = require('crypto');
    const salt = fsSync.readFileSync(saltFile, 'utf-8');
    const data = fsSync.readFileSync(keyFile, 'utf-8');
    const key = crypto.scryptSync(salt, 'tts-key-v1', 32);
    const [ivB64, encB64] = data.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return decipher.update(encB64, 'base64', 'utf-8') + decipher.final('utf-8');
  } catch {
    return null;
  }
}

/** 从加密文件读取用户配置的 Key */
function getStoredRetalkKey(): string | null {
  const fsSync = require('fs');
  const keyFile = path.join(process.cwd(), 'data', 'avatar-key.enc');
  const saltFile = path.join(process.cwd(), 'data', 'avatar-key.salt');
  if (!fsSync.existsSync(keyFile)) return null;
  try {
    const crypto = require('crypto');
    const salt = fsSync.readFileSync(saltFile, 'utf-8');
    const data = fsSync.readFileSync(keyFile, 'utf-8');
    const key = crypto.scryptSync(salt, 'avatar-key-v1', 32);
    const [ivB64, encB64] = data.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return decipher.update(encB64, 'base64', 'utf-8') + decipher.final('utf-8');
  } catch {
    return null;
  }
}

/** 估算费用 */
export function estimateRetalkCost(durationSec: number): number {
  return Math.round(durationSec * PRICE_PER_SEC * 100) / 100;
}

/** 预估剩余免费额度 */
export function getFreeQuotaInfo(): { totalSec: number; pricePerSec: number } {
  return { totalSec: FREE_QUOTA_SEC, pricePerSec: PRICE_PER_SEC };
}

/** 上传本地文件到可访问的 URL（通过 DashScope 文件上传接口） */
async function uploadFile(filePath: string, apiKey: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.mp4': 'video/mp4', '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';
  const fileName = path.basename(filePath);

  // 使用 DashScope 文件上传 API
  const uploadUrl = `${DASHSCOPE_BASE}/uploads`;
  const boundary = '----FormBoundary' + Date.now();
  const bodyParts: Buffer[] = [];

  // 构建 multipart body
  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: ${mime}\r\n\r\n`
  );
  bodyParts.push(header);
  bodyParts.push(buf);
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
  bodyParts.push(footer);
  const body = Buffer.concat(bodyParts);

  const resp = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
    },
    body,
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error('文件上传失败: ' + resp.status + ' ' + err.slice(0, 200));
  }

  const data = await resp.json() as any;
  // DashScope 返回的文件 URL
  return data.data?.url || data.url || '';
}

/** 调用 VideoRetalk 生成口型替换视频 */
export async function generateRetalkVideo(input: {
  videoPath: string;
  audioPath: string;
}): Promise<RetalkResult> {
  const apiKey = getRetalkApiKey();
  if (!apiKey) throw new Error('请先配置阿里云 DashScope API Key');

  const id = generateId();
  const outputDir = path.join(config.video.outputDir);
  await fs.mkdir(outputDir, { recursive: true });

  // 上传视频和音频
  const [videoUrl, audioUrl] = await Promise.all([
    uploadFile(input.videoPath, apiKey),
    uploadFile(input.audioPath, apiKey),
  ]);

  if (!videoUrl) throw new Error('视频文件上传失败，未获取到 URL');
  if (!audioUrl) throw new Error('音频文件上传失败，未获取到 URL');

  // 调用 VideoRetalk 异步任务接口
  const submitUrl = `${DASHSCOPE_BASE}/services/aigc/image2video/video-synthesis/`;
  const submitResp = await fetch(submitUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      input: {
        video_url: videoUrl,
        audio_url: audioUrl,
      },
      parameters: {
        resolution: '720p',
      },
    }),
  });

  if (!submitResp.ok) {
    const err = await submitResp.text().catch(() => '');
    throw new Error('VideoRetalk 任务提交失败: ' + submitResp.status + ' ' + err.slice(0, 300));
  }

  const submitData = await submitResp.json() as any;
  const taskId = submitData.output?.task_id;
  if (!taskId) throw new Error('VideoRetalk 未返回 task_id');

  // 轮询任务状态
  const queryUrl = `${DASHSCOPE_BASE}/tasks/${taskId}`;
  const maxWaitMs = 10 * 60 * 1000; // 最长等10分钟
  const start = Date.now();
  let lastStatus = '';

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 5000)); // 每5秒查一次

    const queryResp = await fetch(queryUrl, {
      headers: { Authorization: 'Bearer ' + apiKey },
    });

    if (!queryResp.ok) continue;

    const queryData = await queryResp.json() as any;
    const status = queryData.output?.task_status || '';
    lastStatus = status;

    if (status === 'SUCCEEDED') {
      const resultVideoUrl = queryData.output?.video_url || queryData.output?.output_video_url || '';
      const durationSec = queryData.output?.video_duration || 0;

      // 下载结果视频到本地
      const outputPath = path.join(outputDir, `retalk_${id}.mp4`);
      if (resultVideoUrl) {
        const videoResp = await fetch(resultVideoUrl);
        if (videoResp.ok) {
          await fs.writeFile(outputPath, Buffer.from(await videoResp.arrayBuffer()));
        }
      }

      return {
        id,
        videoUrl: `/api/output/videos/retalk_${id}.mp4`,
        durationSec,
        estimatedCost: estimateRetalkCost(durationSec),
        createdAt: now(),
      };
    }

    if (status === 'FAILED') {
      const errMsg = queryData.output?.message || queryData.output?.code || '未知错误';
      throw new Error('VideoRetalk 任务失败: ' + errMsg);
    }
  }

  throw new Error('VideoRetalk 任务超时，最后状态: ' + lastStatus);
}

