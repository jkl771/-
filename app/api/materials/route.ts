import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const MATERIAL_DIR = path.join(process.cwd(), 'materials');

function runPyScript(code: string): unknown {
  const tmpPy = path.join(process.cwd(), 'output', '.tmp_mat.py');
  fs.mkdirSync(path.dirname(tmpPy), { recursive: true });
  fs.writeFileSync(tmpPy, code, 'utf-8');
  try {
    const out = execSync(`python "${tmpPy}"`, {
      encoding: 'utf-8', timeout: 10000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const lines = out.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const t = lines[i].trim();
      if (t.startsWith('{') || t.startsWith('[') || t === 'null') return JSON.parse(t);
    }
    return null;
  } finally { try { fs.unlinkSync(tmpPy); } catch {} }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const q = searchParams.get('q')?.toLowerCase();

  const servicesDir = path.join(process.cwd(), 'services').replace(/\\/g, '/');

  if (id) {
    const script = `
import sys, json, os
sys.stdout = open(os.devnull, 'w')
sys.path.insert(0, r'${servicesDir}')
from extract_audio import get_material
_real = type(sys)('_r'); _real.write = sys.__stdout__.write; _real.flush = sys.__stdout__.flush
sys.stdout = _real
result = get_material("${id}")
_real.write(json.dumps(result, ensure_ascii=False) if result else "null")
`;
    const data = runPyScript(script);
    if (!data) return NextResponse.json({ error: '未找到' }, { status: 404 });
    return NextResponse.json({ success: true, data });
  }

  const script = `
import sys, json, os
sys.stdout = open(os.devnull, 'w')
sys.path.insert(0, r'${servicesDir}')
from extract_audio import list_materials
_real = type(sys)('_r'); _real.write = sys.__stdout__.write; _real.flush = sys.__stdout__.flush
sys.stdout = _real
result = list_materials()
_real.write(json.dumps(result, ensure_ascii=False))
`;
  let data = runPyScript(script) as any[];
  if (q && Array.isArray(data)) {
    data = data.filter((item: any) =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.author || '').toLowerCase().includes(q) ||
      (item.platform || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  }
  return NextResponse.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'delete') {
      const matDir = path.join(MATERIAL_DIR, body.id);
      if (!fs.existsSync(matDir)) {
        return NextResponse.json({ error: '素材不存在' }, { status: 404 });
      }
      // 同时删除对应的文案记录
      try {
        const resp = await fetch(`http://localhost:3000/api/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_by_material', materialId: body.id }),
        });
      } catch {}
      // 删除素材文件夹
      fs.rmSync(matDir, { recursive: true, force: true });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'open_folder') {
      const matDir = path.join(MATERIAL_DIR, body.id);
      if (!fs.existsSync(matDir)) {
        return NextResponse.json({ error: '素材目录不存在' }, { status: 404 });
      }
      execSync(`explorer "${matDir}"`);
      return NextResponse.json({ success: true, path: matDir });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '操作失败' }, { status: 500 });
  }
}
