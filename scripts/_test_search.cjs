const child = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
function runPythonScript(code, args, timeout = 15000) {
  const scriptPath = path.join(os.tmpdir(), 'bgm_' + Date.now() + '.py');
  const argLines = args.map((a, i) => 'a' + i + ' = sys.argv[' + (i+1) + ']').join('\n');
  const full = 'import sys\n' + argLines + '\n\n' + code;
  fs.writeFileSync(scriptPath, full, 'utf-8');
  try {
    const cmd = 'python "' + scriptPath + '" ' + args.map(a => '"' + a.replace(/"/g, '\\"') + '"').join(' ');
    return child.execSync(cmd, { timeout, stdio: ['pipe','pipe','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  } finally {
    try { fs.unlinkSync(scriptPath); } catch {}
  }
}
const ccMixterUrl = 'https://ccmixter.org/api/query?datasource=uploads&f=json&limit=5&tags=happy';
const code = `
import urllib.request, json, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req = urllib.request.Request(a0, headers={"User-Agent": "Mozilla/5.0"})
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
    out.append({
        "id": "cc_" + str(item.get("upload_id","")),
        "name": item.get("upload_name") or "Unknown",
        "artist": item.get("user_name") or "",
        "url": mp3.get("download_url"),
        "tags": (item.get("upload_tags") or "").split(","),
    })
print(json.dumps(out))
`;
const result = runPythonScript(code, [ccMixterUrl]);
console.log('result', result.toString('utf-8').trim().slice(0, 400));
