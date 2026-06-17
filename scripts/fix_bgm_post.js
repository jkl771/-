const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', 'utf-8');

// 找到 POST 函数
const postStart = content.indexOf('export async function POST(req: NextRequest) {');
const postEnd = content.indexOf('}', content.indexOf('}', content.indexOf('}', postStart) + 1) + 1) + 1;

// 新的 POST 函数
const newPost = `export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // 处理文件上传
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const name = formData.get('name') as string;
      
      if (!file) {
        return NextResponse.json({ error: '请选择文件' }, { status: 400 });
      }
      
      // 检查文件类型
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\\.(mp3|wav|ogg)$/i)) {
        return NextResponse.json({ error: '只支持 MP3/WAV/OGG 格式' }, { status: 400 });
      }
      
      // 检查文件大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 });
      }
      
      const bgmItem = await uploadBgm(file, name);
      return NextResponse.json({ success: true, data: bgmItem });
    }
    
    // 处理 JSON 请求（下载在线 BGM）
    const { url, name } = await req.json();
    if (!url) return NextResponse.json({ error: '缺少下载链接' }, { status: 400 });

    const safeName = (name || 'bgm').replace(/[^a-zA-Z0-9._\\u4e00-\\u9fff]/g, '_');
    const fileName = Date.now() + '_' + safeName + '.mp3';
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    const filePath = path.join(bgmDir, fileName);

    await fs.mkdir(bgmDir, { recursive: true });

    if (url.includes('ccmixter.org')) {
      const downloadScript = path.join(process.cwd(), 'scripts', 'download_ccmixter.py');
      const child = spawn('python', [downloadScript, url, filePath], {
        timeout: 300000,
        stdio: ['ignore', 'ignore', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });
      child.unref();
      return NextResponse.json({ success: true, data: { status: 'downloading', url: '/bgm/library/' + fileName, fileName } });
    }

    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) return NextResponse.json({ error: '下载失败: ' + resp.status }, { status: 500 });
    const buffer = Buffer.from(await resp.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, data: { url: '/bgm/library/' + fileName, fileName } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '下载失败' }, { status: 500 });
  }
}`;

content = content.substring(0, postStart) + newPost + content.substring(postEnd);
fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', content, 'utf-8');
console.log('Fixed POST function');
