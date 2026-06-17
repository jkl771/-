"""
B站视频支持 - 使用B站API直接获取信息和音频
"""
import urllib.request
import json
import re
import os
import subprocess

FFMPEG_DIR = r"C:\Users\HYH\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin"

def is_bilibili_url(url):
    """检查是否是B站链接"""
    return 'bilibili.com' in url or 'b23.tv' in url

def extract_bvid(url):
    """从URL提取BV号"""
    match = re.search(r'(BV\w+)', url)
    return match.group(1) if match else None

def get_bilibili_info(url):
    """通过B站API获取视频信息"""
    bvid = extract_bvid(url)
    if not bvid:
        return {"error": "无法提取BV号"}
    
    api_url = f"https://api.bilibili.com/x/web-interface/view?bvid={bvid}"
    req = urllib.request.Request(api_url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
    })
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('code') == 0:
                info = data['data']
                return {
                    "title": info.get('title', ''),
                    "author": info.get('owner', {}).get('name', ''),
                    "duration": info.get('duration', 0),
                    "description": info.get('desc', ''),
                    "webpage_url": f"https://www.bilibili.com/video/{bvid}/",
                    "platform": "BiliBili",
                    "platform_name": "B站",
                    "thumbnail": info.get('pic', ''),
                    "cid": info.get('cid'),
                    "aid": info.get('aid'),
                    "bvid": bvid,
                }
            else:
                return {"error": f"B站API错误: {data.get('message', '')}"}
    except Exception as e:
        return {"error": f"请求B站API失败: {str(e)}"}

def get_bilibili_audio_url(bvid, cid):
    """获取B站音频流URL"""
    api_url = f"https://api.bilibili.com/x/player/playurl?bvid={bvid}&cid={cid}&fnval=16"
    req = urllib.request.Request(api_url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
    })
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('code') == 0:
                dash = data.get('data', {}).get('dash', {})
                audio_streams = dash.get('audio', [])
                if audio_streams:
                    # 选择最高质量的音频
                    best = max(audio_streams, key=lambda x: x.get('bandwidth', 0))
                    return best.get('baseUrl') or best.get('base_url')
            return None
    except Exception:
        return None

def download_bilibili_audio(audio_url, output_path):
    """下载B站音频"""
    req = urllib.request.Request(audio_url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
    })
    
    with urllib.request.urlopen(req, timeout=60) as resp:
        with open(output_path, 'wb') as f:
            while True:
                chunk = resp.read(8192)
                if not chunk:
                    break
                f.write(chunk)
    
    return os.path.exists(output_path)

def bilibili_extract(url, material_id, MATERIAL_DIR):
    """B站视频完整提取流程"""
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    
    # 1. 获取视频信息
    info = get_bilibili_info(url)
    if "error" in info:
        return None, info["error"], None
    
    bvid = info.get("bvid")
    cid = info.get("cid")
    
    if not bvid or not cid:
        return None, "无法获取视频ID", info
    
    # 2. 获取音频URL
    audio_url = get_bilibili_audio_url(bvid, cid)
    if not audio_url:
        return None, "无法获取音频流", info
    
    # 3. 下载音频
    raw_audio_path = os.path.join(mat_dir, "audio_raw.m4s")
    audio_path = os.path.join(mat_dir, "audio.mp3")
    
    try:
        download_bilibili_audio(audio_url, raw_audio_path)
    except Exception as e:
        return None, f"下载音频失败: {str(e)}", info
    
    # 4. 转换为mp3
    try:
        ffmpeg_path = os.path.join(FFMPEG_DIR, "ffmpeg.exe")
        result = subprocess.run(
            [ffmpeg_path, "-i", raw_audio_path, "-acodec", "libmp3lame", "-q:a", "2", 
             "-y", audio_path],
            capture_output=True, text=True, timeout=60,
            encoding="utf-8", errors="replace"
        )
        # 清理原始文件
        if os.path.exists(raw_audio_path):
            os.remove(raw_audio_path)
        
        if not os.path.exists(audio_path):
            return None, "音频转换失败", info
    except Exception as e:
        return None, f"音频转换失败: {str(e)}", info
    
    return audio_path, None, info

# 测试
if __name__ == "__main__":
    url = "https://www.bilibili.com/video/BV1z6aEzSEby/"
    print("=== B站视频提取测试 ===")
    
    info = get_bilibili_info(url)
    print(f"Title: {info.get('title')}")
    print(f"Author: {info.get('author')}")
    print(f"Duration: {info.get('duration')}s")
    print(f"BV: {info.get('bvid')}")
    print(f"CID: {info.get('cid')}")
    
    if 'error' not in info:
        audio_url = get_bilibili_audio_url(info['bvid'], info['cid'])
        print(f"Audio URL: {audio_url[:80] if audio_url else 'None'}...")
