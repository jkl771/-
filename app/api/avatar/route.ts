import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { createAvatar, listAvatars, updateAvatar } from '@/services/avatar';
import { generateRetalkVideo, estimateRetalkCost, getFreeQuotaInfo, getRetalkApiKey } from '@/services/avatar-retalk';

async function saveTempFile(file: File, prefix: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), 'output', 'tmp');
  await fs.mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(dir, prefix + '_' + Date.now() + '_' + safeName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let action: string | undefined;
    let body: Record<string, unknown> = {};
    let videoFile: File | undefined;
    let audioFile: File | undefined;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      action = String(form.get('action') || '');
      const rawVideo = form.get('video');
      const rawAudio = form.get('audio');
      videoFile = rawVideo instanceof File && rawVideo.size > 0 ? rawVideo : undefined;
      audioFile = rawAudio instanceof File && rawAudio.size > 0 ? rawAudio : undefined;
      form.forEach((v, k) => { if (k !== 'video' && k !== 'audio' && k !== 'action') body[k] = v; });
    } else {
      const json = await req.json();
      action = json.action;
      body = json;
    }

// Retalk 历史记录辅助
const RETALK_HISTORY_PATH = path.join(process.cwd(), 'data', 'retalk_history.json');
function loadRetalkHistory() {
  try { return JSON.parse(fsSync.readFileSync(RETALK_HISTORY_PATH, 'utf-8')); } catch { return []; }
}
function saveRetalkHistory(records: any[]) {
  fsSync.mkdirSync(path.dirname(RETALK_HISTORY_PATH), { recursive: true });
  fsSync.writeFileSync(RETALK_HISTORY_PATH, JSON.stringify(records, null, 2), 'utf-8');
}
    switch (action) {
      case 'create': {
        const avatar = await createAvatar(body.config as any);
        return NextResponse.json({ success: true, data: avatar });
      }
      case 'list': {
        const avatars = listAvatars();
        return NextResponse.json({ success: true, data: avatars });
      }
      case 'update': {
        const updated = await updateAvatar(body.id as string, body.updates as any);
        if (!updated) return NextResponse.json({ error: '数字人不存在' }, { status: 404 });
        return NextResponse.json({ success: true, data: updated });
      }
      case 'retalk': {
        if (!videoFile) return NextResponse.json({ error: '请上传人物视频' }, { status: 400 });
        if (!audioFile) return NextResponse.json({ error: '请上传人声音频' }, { status: 400 });
        const videoPath = await saveTempFile(videoFile, 'retalk_video');
        const audioPath = await saveTempFile(audioFile, 'retalk_audio');
        try {
          const result = await generateRetalkVideo({ videoPath, audioPath });
          return NextResponse.json({ success: true, data: result });
        } catch (e: any) {
          const errMsg = e.message || '';
          const hint = errMsg.includes('API Key') ? ' [请先配置阿里云 DashScope API Key]' : '';
          return NextResponse.json({ success: false, error: errMsg + hint }, { status: 500 });
        }
      }
      case 'retalk_key': {
        const subAction = String(body.subAction || '');
        const fsSync = require('fs');
        const crypto = require('crypto');
        const keyFile = path.join(process.cwd(), 'data', 'avatar-key.enc');
        const saltFile = path.join(process.cwd(), 'data', 'avatar-key.salt');
        if (subAction === 'get') {
          const hasKey = getRetalkApiKey();
          let masked: string = '';
          try {
            const keyFile = require('path').join(process.cwd(), 'data', 'avatar-key.enc');
            const saltFile = require('path').join(process.cwd(), 'data', 'avatar-key.salt');
            if (fsSync.existsSync(keyFile) && fsSync.existsSync(saltFile)) {
              const enc = fsSync.readFileSync(keyFile, 'utf-8');
              const [ivB64, data] = enc.split(':');
              const salt = fsSync.readFileSync(saltFile, 'utf-8');
              const dk = require('crypto').scryptSync(salt, 'avatar-key-v1', 32);
              const iv = Buffer.from(ivB64, 'base64');
              const decipher = require('crypto').createDecipheriv('aes-256-cbc', dk, iv);
              const key = decipher.update(data, 'base64', 'utf-8') + decipher.final('utf-8');
              masked = key.slice(0,6) + '****' + key.slice(-4);
            }
          } catch {}
          return NextResponse.json({ success: true, data: { configured: !!hasKey, masked } });
        }
        if (subAction === 'save') {
          const key = String(body.apiKey || '');
          if (!key) return NextResponse.json({ error: '请输入 API Key' }, { status: 400 });
          const salt = fsSync.existsSync(saltFile) ? fsSync.readFileSync(saltFile, 'utf-8') : crypto.randomBytes(16).toString('hex');
          const derivedKey = crypto.scryptSync(salt, 'avatar-key-v1', 32);
          const iv = crypto.randomBytes(16);
          const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
          const enc = cipher.update(key, 'utf-8', 'base64') + cipher.final('base64');
          await fs.mkdir(path.dirname(keyFile), { recursive: true });
          fsSync.writeFileSync(keyFile, iv.toString('base64') + ':' + enc, 'utf-8');
          if (!fsSync.existsSync(saltFile)) fsSync.writeFileSync(saltFile, salt, 'utf-8');
          return NextResponse.json({ success: true });
        }
        if (subAction === 'clear') {
          if (fsSync.existsSync(keyFile)) fsSync.unlinkSync(keyFile);
          return NextResponse.json({ success: true });
        }
        if (subAction === 'test' || body.force) {
          const apiKey = getRetalkApiKey();
          if (!apiKey) return NextResponse.json({ success: false, error: '未配置 API Key' });
          try {
            const r = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer', {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'cosyvoice-v3-flash', input: { text: 'test' }, parameters: { voice: 'longanyang', format: 'mp3', sample_rate: 24000 } }),
            });
            if (r.ok) return NextResponse.json({ success: true, data: { message: '连接成功' } });
            const err = await r.text();
            return NextResponse.json({ success: false, error: 'API 返回 ' + r.status + ': ' + err.slice(0, 200) });
          } catch (e: any) {
            return NextResponse.json({ success: false, error: '连接失败: ' + e.message });
          }
        }
        return NextResponse.json({ error: '未知 subAction' }, { status: 400 });
      }
      case 'retalk_info': {
        const info = getFreeQuotaInfo();
        return NextResponse.json({ success: true, data: info });
      }
      case 'retalk_history': {
          const records = loadRetalkHistory();
          return NextResponse.json({ success: true, data: records });
        }
      default:
        return NextResponse.json({ error: '未知 action: ' + action }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '数字人处理失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


