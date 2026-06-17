import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface KeyConfig {
  file: string;
  saltFile: string;
  saltLabel: string;
}

const DASHSCOPE: KeyConfig = {
  file: path.join(process.cwd(), 'data', 'tts-key.enc'),
  saltFile: path.join(process.cwd(), 'data', 'tts-key.salt'),
  saltLabel: 'tts-key-v1',
};

const ELEVENLABS: KeyConfig = {
  file: path.join(process.cwd(), 'data', 'el-key.enc'),
  saltFile: path.join(process.cwd(), 'data', 'el-key.salt'),
  saltLabel: 'el-key-v1',
};

function getSalt(cfg: KeyConfig): string {
  if (fs.existsSync(cfg.saltFile)) return fs.readFileSync(cfg.saltFile, 'utf-8');
  const salt = crypto.randomBytes(16).toString('hex');
  fs.mkdirSync(path.dirname(cfg.saltFile), { recursive: true });
  fs.writeFileSync(cfg.saltFile, salt, 'utf-8');
  return salt;
}

function encrypt(text: string, cfg: KeyConfig): string {
  const key = crypto.scryptSync(getSalt(cfg), cfg.saltLabel, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return iv.toString('base64') + ':' + cipher.update(text, 'utf-8', 'base64') + cipher.final('base64');
}

function decrypt(data: string, cfg: KeyConfig): string {
  const key = crypto.scryptSync(getSalt(cfg), cfg.saltLabel, 32);
  const [ivB64, encB64] = data.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivB64, 'base64'));
  return decipher.update(encB64, 'base64', 'utf-8') + decipher.final('utf-8');
}

function getKey(cfg: KeyConfig): string | null {
  if (!fs.existsSync(cfg.file)) return null;
  try { return decrypt(fs.readFileSync(cfg.file, 'utf-8'), cfg); } catch { return null; }
}

export function saveKey(value: string, cfg: KeyConfig): void {
  fs.mkdirSync(path.dirname(cfg.file), { recursive: true });
  fs.writeFileSync(cfg.file, encrypt(value, cfg), 'utf-8');
}

export function clearKey(cfg: KeyConfig): void {
  if (fs.existsSync(cfg.file)) fs.unlinkSync(cfg.file);
}

export function maskKey(key: string): string {
  return key.slice(0, 6) + '****' + key.slice(-4);
}

export const dashscopeKey = { cfg: DASHSCOPE, get: () => getKey(DASHSCOPE), save: (v: string) => saveKey(v, DASHSCOPE), clear: () => clearKey(DASHSCOPE) };
export const elevenlabsKey = { cfg: ELEVENLABS, get: () => getKey(ELEVENLABS), save: (v: string) => saveKey(v, ELEVENLABS), clear: () => clearKey(ELEVENLABS) };
