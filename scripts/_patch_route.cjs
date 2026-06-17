const fs=require('fs');
const p='C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts';
let c=fs.readFileSync(p,'utf8');
if(!c.includes("import fsSync from 'fs'")){
  c=c.replace("import fs from 'fs/promises';", "import fs from 'fs/promises';\nimport fsSync from 'fs';");
}
const old=`    let buffer: Buffer;
    if (url.includes('ccmixter.org')) {
      const os = require('os');
      const tempFile = path.join(os.tmpdir(), 'bgm_' + Date.now() + '.mp3');
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
    } else {`;
const rep=`    let buffer: Buffer;
    if (url.includes('ccmixter.org')) {
      const os = require('os');
      const tempFile = path.join(os.tmpdir(), 'bgm_' + Date.now() + '.mp3');
      const downloadScript = path.join(process.cwd(), 'scripts', 'download_ccmixter.py');
      const { execSync } = require('child_process');
      execSync('python "' + downloadScript + '" "' + url.replace(/"/g,'\\"') + '" "' + tempFile.replace(/"/g,'\\"') + '"', { timeout: 35000, stdio: ['ignore','ignore','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
      buffer = fsSync.readFileSync(tempFile);
      try { fsSync.unlinkSync(tempFile); } catch {}
    } else {`;
if(!c.includes(rep)){ c=c.replace(old, rep); }
fs.writeFileSync(p,c,'utf8');
console.log('patched-route');