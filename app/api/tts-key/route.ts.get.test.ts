import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: true, data: { configured: true } });
}

export async function POST(req: NextRequest) {
  const { action } = await req.json();
  return NextResponse.json({ success: true, action });
}
