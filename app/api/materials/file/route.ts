import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const MATERIAL_DIR = path.join(process.cwd(), 'materials');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type'); // 'video' or 'audio'

  if (!id || !type) {
    return NextResponse.json({ error: '缺少 id 或 type 参数' }, { status: 400 });
  }

  const filename = type === 'video' ? 'video.mp4' : 'audio.mp3';
  const filePath = path.join(MATERIAL_DIR, id, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const contentType = type === 'video' ? 'video/mp4' : 'audio/mpeg';

  const file = fs.readFileSync(filePath);
  return new NextResponse(file, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': stat.size.toString(),
      'Accept-Ranges': 'bytes',
    },
  });
}
