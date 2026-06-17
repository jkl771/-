import { NextRequest, NextResponse } from 'next/server';
import { generateCoverInfo } from '@/services/cover';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, platform, style, count } = body;

    if (!content) {
      return NextResponse.json({ error: '请提供 content 参数' }, { status: 400 });
    }

    const result = await generateCoverInfo({ content, platform, style, count });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '封面生成失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
