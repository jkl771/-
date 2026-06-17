import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const KEY_FILE = path.join(process.cwd(), 'data', 'tts-key.enc');
const SALT_FILE = path.join(process.cwd(), 'data', 'tts-key.salt');

function getSalt(): string {
  if (fs.existsSync(SALT_FILE)) return fs.readFileSync(SALT_FILE, 'utf-8');
  const salt = crypto.randomBytes(16).toString('hex');
  fs.mkdirSync(path.dirname(SALT_FILE), { recursive: true });
  fs.writeFileSync(SALT_FILE, salt, 'utf-8');
  return salt;
}

function encrypt(text: string): string {
  const salt = getSalt();
  const key = crypto.scryptSync(salt, 'tts-key-v1', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let enc = cipher.update(text, 'utf-8', 'base64');
  enc += cipher.final('base64');
  return iv.toString('base64') + ':' + enc;
}

function decrypt(data: string): string {
  const salt = getSalt();
  const key = crypto.scryptSync(salt, 'tts-key-v1', 32);
  const [ivB64, encB64] = data.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let dec = decipher.update(encB64, 'base64', 'utf-8');
  dec += decipher.final('utf-8');
  return dec;
}

export function getApiKey(): string | null {
  if (!fs.existsSync(KEY_FILE)) return null;
  try { return decrypt(fs.readFileSync(KEY_FILE, 'utf-8')); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { action, apiKey } = await req.json();

    if (action === 'save') {
      if (!apiKey || typeof apiKey !== 'string') return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
      fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
      fs.writeFileSync(KEY_FILE, encrypt(apiKey), 'utf-8');
      return NextResponse.json({ success: true });
    }

    if (action === 'get') {
      const key = getApiKey();
      if (!key) return NextResponse.json({ success: true, data: { configured: false } });
      return NextResponse.json({ success: true, data: { configured: true, masked: key.slice(0, 6) + '****' + key.slice(-4) } });
    }

    if (action === 'clear') {
      if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE);
      return NextResponse.json({ success: true });
    }

    if (action === 'test') {
      const key = getApiKey();
      if (!key) return NextResponse.json({ success: false, error: '未配置 API Key' });
      try {
        const r = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'cosyvoice-v3-flash', input: { text: 'test' }, parameters: { voice: 'longanyang', format: 'mp3', sample_rate: 24000 } }),
        });
        if (r.ok) return NextResponse.json({ success: true, data: { message: '连接成功' } });
        const err = await r.text();
        return NextResponse.json({ success: false, error: 'API 返回 ' + r.status + ': ' + err.slice(0, 200) });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: '连接失败: ' + e.message });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
