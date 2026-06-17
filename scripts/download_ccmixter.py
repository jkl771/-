import sys, urllib.request, ssl
url=sys.argv[1]; out=sys.argv[2]
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
req=urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0','Referer':'https://ccmixter.org/'})
resp=urllib.request.urlopen(req, timeout=30, context=ctx)
with open(out,'wb') as f:
    f.write(resp.read())