import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const name = form.get('name') || 'bgm';
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = String(name).replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, '_');
    const fileName = Date.now() + '_' + safeName;
    const dir = path.join(process.cwd(), 'public', 'bgm', 'library');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, data: { url: '/bgm/library/' + fileName, fileName } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}