import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const KEY_FILE = path.join(process.cwd(), 'data', 'el-key.enc');
const SALT_FILE = path.join(process.cwd(), 'data', 'el-key.salt');

function getSalt(): string {
  if (fs.existsSync(SALT_FILE)) return fs.readFileSync(SALT_FILE, 'utf-8');
  const salt = crypto.randomBytes(16).toString('hex');
  fs.mkdirSync(path.dirname(SALT_FILE), { recursive: true });
  fs.writeFileSync(SALT_FILE, salt, 'utf-8');
  return salt;
}

function encrypt(text: string): string {
  const key = crypto.scryptSync(getSalt(), 'el-key-v1', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return iv.toString('base64') + ':' + cipher.update(text, 'utf-8', 'base64') + cipher.final('base64');
}

function decrypt(data: string): string {
  const key = crypto.scryptSync(getSalt(), 'el-key-v1', 32);
  const [ivB64, encB64] = data.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivB64, 'base64'));
  return decipher.update(encB64, 'base64', 'utf-8') + decipher.final('utf-8');
}

export function getElevenLabsApiKey(): string | null {
  if (!fs.existsSync(KEY_FILE)) return null;
  try { return decrypt(fs.readFileSync(KEY_FILE, 'utf-8')); } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const { action, apiKey } = await req.json();

    if (action === 'save') {
      if (!apiKey) return NextResponse.json({ success: false, error: 'Key required' }, { status: 400 });
      fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
      fs.writeFileSync(KEY_FILE, encrypt(apiKey), 'utf-8');
      return NextResponse.json({ success: true });
    }

    if (action === 'get') {
      const key = getElevenLabsApiKey();
      if (!key) return NextResponse.json({ success: true, data: { configured: false } });
      return NextResponse.json({ success: true, data: { configured: true, masked: key.slice(0, 6) + '****' + key.slice(-4) } });
    }

    if (action === 'clear') {
      if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE);
      return NextResponse.json({ success: true });
    }

    if (action === 'test') {
      const key = getElevenLabsApiKey();
      if (!key) return NextResponse.json({ success: false, error: '未配置' });
      try {
        const r = await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': key } });
        if (r.ok) { const d = await r.json() as any; return NextResponse.json({ success: true, data: { message: '连接成功！用户: ' + (d?.first_name || 'OK') } }); }
        return NextResponse.json({ success: false, error: 'API 返回 ' + r.status });
      } catch (e: any) {
        return NextResponse.json({ success: false, error: '连接失败: ' + e.message });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
