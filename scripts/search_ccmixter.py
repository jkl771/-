import sys, json, urllib.request, ssl
from urllib.parse import urlparse, parse_qs
url = sys.argv[1]
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'})
resp = urllib.request.urlopen(req, timeout=15, context=ctx)
raw = resp.read().decode('utf-8')
items = json.loads(raw)
out=[]
for item in items:
    mp3=None
    for f in (item.get('files') or []):
        u=(f.get('download_url') or '')
        if f.get('file_nicname')=='mp3' or u.lower().endswith('.mp3'):
            mp3=f; break
    if not mp3:
        continue
    out.append({
        'id':'cc_'+str(item.get('upload_id','')),
        'name':item.get('upload_name') or 'Unknown',
        'artist':item.get('user_name') or '',
        'url':mp3.get('download_url'),
        'tags':[t for t in (item.get('upload_tags') or '').split(',') if t][:8],
    })
print(json.dumps(out, ensure_ascii=False))