const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let text = fs.readFileSync(p, 'utf-8');
const start = text.indexOf('async function searchCcmixter');
const end = text.indexOf('\n}\n', start) + 3;
const oldFn = text.slice(start, end);
const newFn = `async function searchCcmixter(query: string, limit = 10): Promise<BgmItem[]> {
  try {
    const ccMixterUrl = 'https://ccmixter.org/api/query?datasource=uploads&f=json&limit=' + limit + '&tags=' + encodeURIComponent(query);
    const code = \`
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
\`;
    const result = runPythonScript(code, [ccMixterUrl]);
    const parsed = JSON.parse(result.toString('utf-8').trim());
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: '在线',
      source: 'ccmixter',
      url: item.url,
      artist: item.artist,
      tags: (item.tags || []).filter(Boolean).slice(0, 6),
    }));
  } catch {
    return [];
  }
}
`;
text = text.slice(0, start) + newFn + text.slice(end);
fs.writeFileSync(p, text, 'utf-8');
console.log('replaced-search');
