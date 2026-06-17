const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const oldPost = `export async function POST(req: NextRequest) {
  try {
    const { url, name } = await req.json();
    if (!url) return NextResponse.json({ error: '缺少下载链接' }, { status: 400 });

    let buffer: Buffer;
    if (url.includes('ccmixter.org')) {
      const code = \`
import urllib.request, ssl, sys
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req = urllib.request.Request(a0, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://ccmixter.org/"})
resp = urllib.request.urlopen(req, timeout=30, context=ctx)
sys.stdout.buffer.write(resp.read())
\`;
      buffer = runPythonScript(code, [url], 35000);
    } else {
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!resp.ok) return NextResponse.json({ error: '下载失败: ' + resp.status }, { status: 500 });
      buffer = Buffer.from(await resp.arrayBuffer());
    }

    const safeName = (name || 'bgm').replace(/[^a-zA-Z0-9._\\u4e00-\\u9fff-]/g, '_');
    const fileName = Date.now() + '_' + safeName + '.mp3';
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    await fs.mkdir(bgmDir, { recursive: true });
    const filePath = path.join(bgmDir, fileName);
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ success: true, data: { url: '/bgm/library/' + fileName, fileName } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '下载失败' }, { status: 500 });
  }
}`;
const newPost = `export async function POST(req: NextRequest) {
  try {
    const { url, name } = await req.json();
    if (!url) return NextResponse.json({ error: '缺少下载链接' }, { status: 400 });

    let buffer: Buffer;
    if (url.includes('ccmixter.org')) {
      const os = require('os');
      const tempFile = path.join(os.tempdir(), 'bgm_' + Date.now() + '.mp3');
      const code = \`
import urllib.request, ssl, sys
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req = urllib.request.Request(a0, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://ccmixter.org/"})
resp = urllib.request.urlopen(req, timeout=30, context=ctx)
with open(a1, 'wb') as f:
    f.write(resp.read())
\`;
      runPythonScript(code, [url, tempFile], 35000);
      buffer = fs.readFileSync(tempFile);
      fs.unlinkSync(tempFile);
    } else {
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!resp.ok) return NextResponse.json({ error: '下载失败: ' + resp.status }, { status: 500 });
      buffer = Buffer.from(await resp.arrayBuffer());
    }

    const safeName = (name || 'bgm').replace(/[^a-zA-Z0-9._\\u4e00-\\u9fff-]/g, '_');
    const fileName = Date.now() + '_' + safeName + '.mp3';
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    await fs.mkdir(bgmDir, { recursive: true });
    const filePath = path.join(bgmDir, fileName);
    await fs.writeFile(filePath, buffer);
    return NextResponse.json({ success: true, data: { url: '/bgm/library/' + fileName, fileName } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '下载失败' }, { status: 500 });
  }
}`;
s = s.replace(oldPost, newPost);
fs.writeFileSync(p, s, 'utf-8');
console.log('fixed-post-download');
