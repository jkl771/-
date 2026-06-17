import { NextRequest, NextResponse } from 'next/server';
import { elevenlabsKey, maskKey } from '@/lib/api-keys';

export async function POST(req: NextRequest) {
  try {
    const { action, apiKey } = await req.json();

    if (action === 'save') {
      if (!apiKey) return NextResponse.json({ success: false, error: 'Key required' }, { status: 400 });
      elevenlabsKey.save(apiKey);
      return NextResponse.json({ success: true });
    }

    if (action === 'get') {
      const key = elevenlabsKey.get();
      if (!key) return NextResponse.json({ success: true, data: { configured: false } });
      return NextResponse.json({ success: true, data: { configured: true, masked: maskKey(key) } });
    }

    if (action === 'clear') {
      elevenlabsKey.clear();
      return NextResponse.json({ success: true });
    }

    if (action === 'test') {
      const key = elevenlabsKey.get();
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
