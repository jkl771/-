const fs=require('fs');
const p='C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts';
let c=fs.readFileSync(p,'utf8');
const importOld="import fs from 'fs/promises';";
const importNew="import fs from 'fs/promises';\nimport fsSync from 'fs';\nimport { spawn } from 'child_process';";
if(c.includes(importOld) && !c.includes(importNew)){
  c=c.replace(importOld, importNew);
}
const postOld=`  try {
    const { url, name } = await req.json();
    if (!url) return NextResponse.json({ error: '缺少下载链接' }, { status: 400 });

    let buffer: Buffer;
    if (url.includes('ccmixter.org')) {
      const os = require('os');
      const tempFile = path.join(os.tmpdir(), 'bgm_' + Date.now() + '.mp3');
      const downloadScript = path.join(process.cwd(), 'scripts', 'download_ccmixter.py');
      const { execSync } = require('child_process');
      execSync(`python "${downloadScript}" "${url.replace(/"/g,'\\\"')}" "${tempFile.replace(/"/g,'\\\"')}"`, { timeout: 180000, stdio: ['ignore','ignore','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      buffer = fsSync.readFileSync(tempFile);
      try { fsSync.unlinkSync(tempFile); } catch {}
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
const postNew=`  try {
    const { url, name, async: isAsync } = await req.json();
    if (!url) return NextResponse.json({ error: '缺少下载链接' }, { status: 400 });

    const safeName = (name || 'bgm').replace(/[^a-zA-Z0-9._\\u4e00-\\u9fff-]/g, '_');
    const fileName = Date.now() + '_' + safeName + '.mp3';
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    const filePath = path.join(bgmDir, fileName);

    await fs.mkdir(bgmDir, { recursive: true });

    if (url.includes('ccmixter.org')) {
      if (isAsync) {
        const downloadScript = path.join(process.cwd(), 'scripts', 'download_ccmixter.py');
        const child = spawn('python', [downloadScript, url, filePath], {
          timeout: 300000,
          stdio: ['ignore', 'ignore', 'pipe'],
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });
        child.unref();
        return NextResponse.json({ success: true, data: { status: 'downloading', url: '/bgm/library/' + fileName, fileName } });
      }

      const downloadScript = path.join(process.cwd(), 'scripts', 'download_ccmixter.py');
      await new Promise<void>((resolve, reject) => {
        const child = spawn('python', [downloadScript, url, filePath], {
          timeout: 300000,
          stdio: ['ignore', 'ignore', 'pipe'],
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });
        let stderr = '';
        child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        child.on('error', reject);
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(stderr || '下载失败'));
        });
      });
    } else {
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!resp.ok) return NextResponse.json({ error: '下载失败: ' + resp.status }, { status: 500 });
      const buffer = Buffer.from(await resp.arrayBuffer());
      await fs.writeFile(filePath, buffer);
    }

    return NextResponse.json({ success: true, data: { url: '/bgm/library/' + fileName, fileName } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '下载失败' }, { status: 500 });
  }
}`;
if(c.includes(postOld)){
  c=c.replace(postOld, postNew);
}
fs.writeFileSync(p,c,'utf8');
console.log('patched-post-route');