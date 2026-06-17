import re, os, json, hashlib
from datetime import datetime

# URL 解析缓存（避免重复解析短链）
_url_cache = {}

def resolve_short_url_fast(url):
    """快速解析短链 - 带缓存"""
    if url in _url_cache:
        return _url_cache[url]
    
    # 如果已经是完整链接，直接返回
    if '/video/' in url:
        _url_cache[url] = url
        return url
    
    import subprocess
    try:
        result = subprocess.run(
            ["yt-dlp", "--print", "webpage_url", "--no-download", url],
            capture_output=True, text=True, timeout=15,
            encoding="utf-8", errors="replace"
        )
        if result.returncode == 0 and result.stdout.strip():
            real_url = result.stdout.strip()
            _url_cache[url] = real_url
            return real_url
    except Exception:
        pass
    
    _url_cache[url] = url
    return url
