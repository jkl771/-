const child = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sp = path.join(os.tmpdir(), 'bgm_search_test.py');
const code = `import urllib.request, json, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req = urllib.request.Request('https://ccmixter.org/api/query?datasource=uploads&f=json&limit=5&tags=happy', headers={"User-Agent": "Mozilla/5.0"})
resp = urllib.request.urlopen(req, timeout=10, context=ctx)
raw = resp.read().decode("utf-8")
parsed = json.loads(raw)
out = []
for item in parsed:
    files = item.get("files") or []
    mp3 = None
    for f in files:
        if f.get("file_nicname") == "mp3" or (f.get("download_url") or "").endswith(".mp3"):
            mp3 = f
            break
    if not mp3:
        continue
    out.append({"id": "cc_" + str(item.get("upload_id","")), "name": item.get("upload_name") or "Unknown", "artist": item.get("user_name") or "", "url": mp3.get("download_url"), "tags": (item.get("upload_tags") or "").split(",")})
print(json.dumps(out))
`;
fs.writeFileSync(sp, code, 'utf-8');
try {
  const out = child.execSync('python "' + sp + '"', { timeout: 15000, stdio: ['pipe','pipe','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  console.log('ok', out.toString().trim().slice(0, 500));
} catch (e) {
  console.error('err', e.stderr ? e.stderr.toString() : String(e));
} finally {
  try { fs.unlinkSync(sp); } catch {}
}
