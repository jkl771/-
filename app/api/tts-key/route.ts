import { NextRequest, NextResponse } from 'next/server';
import { dashscopeKey, maskKey } from '@/lib/api-keys';

export async function POST(req: NextRequest) {
  try {
    const { action, apiKey } = await req.json();

    if (action === 'save') {
      if (!apiKey || typeof apiKey !== 'string') return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
      dashscopeKey.save(apiKey);
      return NextResponse.json({ success: true });
    }

    if (action === 'get') {
      const key = dashscopeKey.get();
      if (!key) return NextResponse.json({ success: true, data: { configured: false } });
      return NextResponse.json({ success: true, data: { configured: true, masked: maskKey(key) } });
    }

    if (action === 'clear') {
      dashscopeKey.clear();
      return NextResponse.json({ success: true });
    }

    if (action === 'test') {
      const key = dashscopeKey.get();
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
