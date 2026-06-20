import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PREF_FILE = path.join(process.cwd(), 'data', 'user_prefs.json');

function readPrefs(): Record<string, unknown> {
  try {
    if (!fs.existsSync(PREF_FILE)) return {};
    return JSON.parse(fs.readFileSync(PREF_FILE, 'utf-8'));
  } catch { return {}; }
}

function writePrefs(prefs: Record<string, unknown>) {
  const dir = path.dirname(PREF_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PREF_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'get') {
      const prefs = readPrefs();
      return NextResponse.json({ success: true, data: prefs });
    }

    if (action === 'set') {
      const key = String(body.key || '');
      const value = body.value;
      if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
      const prefs = readPrefs();
      prefs[key] = value;
      writePrefs(prefs);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const key = String(body.key || '');
      const prefs = readPrefs();
      delete prefs[key];
      writePrefs(prefs);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}