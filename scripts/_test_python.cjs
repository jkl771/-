const child = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sp = path.join(os.tmpdir(), 'bgm_test.py');
const code = `import urllib.request, json, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req = urllib.request.Request('https://ccmixter.org/api/query?datasource=uploads&f=json&limit=5&tags=happy', headers={"User-Agent": "Mozilla/5.0"})
resp = urllib.request.urlopen(req, timeout=10, context=ctx)
raw = resp.read().decode("utf-8")
print(len(raw))
`;
fs.writeFileSync(sp, code, 'utf-8');
try {
  const out = child.execSync('python "' + sp + '"', { timeout: 15000, stdio: ['pipe','pipe','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  console.log('ok', out.toString().trim());
} catch (e) {
  console.error('err', e.stderr ? e.stderr.toString() : String(e));
} finally {
  try { fs.unlinkSync(sp); } catch {}
}
