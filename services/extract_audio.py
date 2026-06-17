"""
视频智能体 - 音频提取与语音转文字服务（优化版）
重点优化：时间轴精度、平台识别、转写速度
"""

import subprocess
import os
import json
import re
import sys
import shutil
import hashlib
import urllib.request
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "output", "audio")
MATERIAL_DIR = os.path.join(BASE_DIR, "materials")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MATERIAL_DIR, exist_ok=True)

FFMPEG_DIR = r"C:\Users\HYH\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin"


# URL 解析缓存
_url_cache = {}

PLATFORM_MAP = {
    "douyin.com": "抖音", "v.douyin.com": "抖音",
    "tiktok.com": "TikTok",
    "kuaishou.com": "快手", "v.kuaishou.com": "快手",
    "bilibili.com": "B站", "b23.tv": "B站",
    "xiaohongshu.com": "小红书", "xhslink.com": "小红书",
    "weixin.qq.com": "视频号", "channels.weixin.qq.com": "视频号",
    "youtube.com": "YouTube", "youtu.be": "YouTube",
    "twitter.com": "Twitter", "x.com": "Twitter",
}


def detect_platform(url):
    """识别视频平台"""
    if not url:
        return "其他"
    url_lower = url.lower()
    for key, name in PLATFORM_MAP.items():
        if key in url_lower:
            return name
    return "其他"



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
    
    with urllib.request.urlopen(req, timeout=120) as resp:
        with open(output_path, 'wb') as f:
            while True:
                chunk = resp.read(8192)
                if not chunk:
                    break
                f.write(chunk)
    
    return os.path.exists(output_path)

def bilibili_extract_audio(url, material_id):
    """B站音频提取：API下载 + ffmpeg转mp3"""
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    
    info = get_bilibili_info(url)
    if "error" in info:
        return None, info, None
    
    bvid = info.get("bvid")
    cid = info.get("cid")
    if not bvid or not cid:
        return None, {"error": "无法获取视频ID"}, info
    
    audio_url = get_bilibili_audio_url(bvid, cid)
    if not audio_url:
        return None, {"error": "无法获取音频流"}, info
    
    raw_path = os.path.join(mat_dir, "audio_raw.m4s")
    audio_path = os.path.join(mat_dir, "audio.mp3")
    
    try:
        download_bilibili_audio(audio_url, raw_path)
    except Exception as e:
        return None, {"error": f"下载音频失败: {str(e)}"}, info
    
    try:
        ffmpeg_path = os.path.join(FFMPEG_DIR, "ffmpeg.exe")
        result = subprocess.run(
            [ffmpeg_path, "-i", raw_path, "-acodec", "libmp3lame", "-q:a", "2",
             "-y", audio_path],
            capture_output=True, text=True, timeout=120,
            encoding="utf-8", errors="replace"
        )
        if os.path.exists(raw_path):
            os.remove(raw_path)
        if not os.path.exists(audio_path):
            return None, {"error": "音频转换失败"}, info
    except Exception as e:
        return None, {"error": f"音频转换失败: {str(e)}"}, info
    
    return audio_path, None, info

def bilibili_download_video(url, material_id):
    """B站视频下载（使用yt-dlp，可能失败）"""
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    output_path = os.path.join(mat_dir, "video.mp4")
    
    bvid = extract_bvid(url)
    if not bvid:
        return None
    
    # 尝试用yt-dlp下载视频（B站视频下载可能也需要特殊处理）
    video_url_api = f"https://api.bilibili.com/x/player/playurl?bvid={bvid}"
    # 简化处理：视频下载跳过，只下载音频
    return None



def parse_share_text(share_text):
    """从分享文本中提取 URL 和元信息"""
    url_match = re.search(r'https?://\S+', share_text)
    url = url_match.group(0) if url_match else ""
    tags = re.findall(r'#\S+', share_text)
    mentions = re.findall(r'@\S+', share_text)
    description = share_text
    for pattern in [
        r'https?://\S+',
        r'[\d.]+\s*:\d+\w*\s+\S+\s+\S+\s+\d+/\d+',
        r'复制此链接[，,][^！。]*[！。]?',
        r'打开\S+搜索',
        r'直接观看视频',
        r'@\S+',
        r'👉',
    ]:
        description = re.sub(pattern, '', description)
    description = re.sub(r'\s+', ' ', description).strip()
    return {"url": url, "description": description, "tags": tags, "mentions": mentions}


def resolve_short_url(url):
    if url in _url_cache:
        return _url_cache[url]
    # 已经是完整链接
    if '/video/' in url and 'douyin.com' in url:
        _url_cache[url] = url
        return url
    try:
        result = subprocess.run(
            ["yt-dlp", "--print", "webpage_url", "--no-download",
             "--no-check-certificates", "--prefer-insecure", url],
            capture_output=True, text=True, timeout=10,
            encoding="utf-8", errors="replace"
        )
        if result.returncode == 0 and result.stdout.strip():
            real = result.stdout.strip()
            _url_cache[url] = real
            return real
    except Exception:
        pass
    _url_cache[url] = url
    return url


def get_video_info(url):
    try:
        result = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-download",
             "--no-check-certificates", "--prefer-insecure", url],
            capture_output=True, text=True, timeout=60,
            encoding="utf-8", errors="replace"
        )
        if result.returncode == 0:
            info = json.loads(result.stdout)
            return {
                "title": info.get("title", ""),
                "author": info.get("uploader", info.get("channel", "")),
                "duration": info.get("duration", 0),
                "description": info.get("description", ""),
                "webpage_url": info.get("webpage_url", url),
                "platform": info.get("extractor", ""),
                "platform_name": detect_platform(url),
                "thumbnail": info.get("thumbnail", ""),
            }
    except Exception as e:
        return {"error": str(e)}
    return {"error": "无法获取视频信息"}


def download_audio(url, material_id):
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    output_path = os.path.join(mat_dir, "audio.mp3")
    if os.path.exists(output_path):
        os.remove(output_path)
    result = subprocess.run(
        ["yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "0",
         "-o", output_path, "--no-playlist", "--socket-timeout", "60",
         "--ffmpeg-location", FFMPEG_DIR,
         "--no-check-certificates", "--prefer-insecure", url],
        capture_output=True, text=True, timeout=300,
        encoding="utf-8", errors="replace"
    )
    if result.returncode != 0:
        raise Exception(f"音频下载失败: {result.stderr[:500]}")
    if os.path.exists(output_path):
        return output_path
    base = os.path.splitext(output_path)[0]
    for ext in [".mp3", ".m4a", ".wav", ".opus", ".webm"]:
        if os.path.exists(base + ext):
            return base + ext
    raise Exception("音频文件未找到")


def download_video(url, material_id):
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    output_path = os.path.join(mat_dir, "video.mp4")
    if os.path.exists(output_path):
        os.remove(output_path)
    result = subprocess.run(
        ["yt-dlp", "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
         "--merge-output-format", "mp4", "-o", output_path, "--no-playlist",
         "--socket-timeout", "60", "--ffmpeg-location", FFMPEG_DIR,
         "--no-check-certificates", "--prefer-insecure", url],
        capture_output=True, text=True, timeout=600,
        encoding="utf-8", errors="replace"
    )
    if result.returncode != 0:
        return None
    if os.path.exists(output_path):
        return output_path
    return None


# ---- 全局模型缓存（避免每次重新加载）----
_model_cache = {}

def _get_model():
    """获取或缓存 FunASR 模型"""
    if "model" not in _model_cache:
        # 重定向 stdout/stderr 防止 torchaudio 的警告
        old_stdout, old_stderr = sys.stdout, sys.stderr
        sys.stdout = open(os.devnull, 'w')
        sys.stderr = open(os.devnull, 'w')
        try:
            from funasr import AutoModel
            _model_cache["model"] = AutoModel(
                model="paraformer-zh",
                vad_model="fsmn-vad",
                punc_model="ct-punc",
                device="cpu",
                disable_update=True,
                hub="ms",
            )
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr
    return _model_cache["model"]


def transcribe_with_funasr(audio_path):
    """使用 FunASR 转写，返回带时间戳的分段结果"""
    model = _get_model()

    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout = open(os.devnull, 'w')
    sys.stderr = open(os.devnull, 'w')
    try:
        result = model.generate(input=audio_path, batch_size_s=60)
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    if not result or len(result) == 0:
        return {"text": "", "segments": []}

    item = result[0]
    text = item.get("text", "")
    raw_ts = item.get("timestamp", [])

    # 按句子切分（中文句号/感叹号/问号/分号，英文句号/感叹号/问号）
    sentences = re.split(r'(?<=[\u3002\uff01\uff1f\uff1b\n])|(?<=[.!?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    segments = []
    if raw_ts and len(raw_ts) > 0:
        total_text_chars = len(text.replace(' ', '').replace('\n', ''))
        total_ts = len(raw_ts)
        ts_idx = 0

        for sent in sentences:
            sent_chars = len(sent.replace(' ', ''))
            ratio = sent_chars / total_text_chars if total_text_chars > 0 else 1.0 / len(sentences)
            ts_count = max(1, round(ratio * total_ts))

            if ts_idx >= total_ts:
                if segments:
                    last_end = segments[-1]["end"]
                    est_dur = sent_chars * 0.25
                    segments.append({"text": sent, "start": last_end, "end": last_end + est_dur})
                else:
                    segments.append({"text": sent, "start": 0, "end": 0})
                continue

            start_ms = raw_ts[ts_idx][0]
            end_idx = min(ts_idx + ts_count - 1, total_ts - 1)
            end_ms = raw_ts[end_idx][1]
            ts_idx = end_idx + 1

            segments.append({
                "text": sent,
                "start": round(start_ms / 1000.0, 2),
                "end": round(end_ms / 1000.0, 2),
            })
    else:
        total_chars = sum(len(s) for s in sentences)
        est_duration = total_chars / 4.0
        current = 0.0
        for sent in sentences:
            dur = (len(sent) / total_chars) * est_duration if total_chars > 0 else 0
            segments.append({"text": sent, "start": round(current, 2), "end": round(current + dur, 2)})
            current += dur

    total_duration = round(segments[-1]["end"], 1) if segments else 0
    return {"text": text, "language": "zh", "duration": total_duration, "segments": segments}


def list_materials():
    materials = []
    if not os.path.exists(MATERIAL_DIR):
        return materials
    for mat_id in sorted(os.listdir(MATERIAL_DIR)):
        mat_dir = os.path.join(MATERIAL_DIR, mat_id)
        if not os.path.isdir(mat_dir):
            continue
        info_path = os.path.join(mat_dir, "info.json")
        if os.path.exists(info_path):
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)
            info["id"] = mat_id
            info["has_video"] = os.path.exists(os.path.join(mat_dir, "video.mp4"))
            info["has_audio"] = os.path.exists(os.path.join(mat_dir, "audio.mp3"))
            for fkey, fname in [("video_size", "video.mp4"), ("audio_size", "audio.mp3")]:
                fpath = os.path.join(mat_dir, fname)
                info[fkey] = os.path.getsize(fpath) if os.path.exists(fpath) else 0
            materials.append(info)
    return sorted(materials, key=lambda x: x.get("created_at", ""), reverse=True)


def get_material(material_id):
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    info_path = os.path.join(mat_dir, "info.json")
    if not os.path.exists(info_path):
        return None
    with open(info_path, "r", encoding="utf-8") as f:
        info = json.load(f)
    info["id"] = material_id
    info["has_video"] = os.path.exists(os.path.join(mat_dir, "video.mp4"))
    info["has_audio"] = os.path.exists(os.path.join(mat_dir, "audio.mp3"))
    for fkey, fname in [("video_size", "video.mp4"), ("audio_size", "audio.mp3")]:
        fpath = os.path.join(mat_dir, fname)
        info[fkey] = os.path.getsize(fpath) if os.path.exists(fpath) else 0
    return info


def delete_material(material_id):
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    if not os.path.exists(mat_dir):
        return False
    shutil.rmtree(mat_dir)
    return True


def check_duplicate(url=None, share_text=None):
    if share_text and not url:
        parsed = parse_share_text(share_text)
        url = parsed.get("url", "")
    if not url:
        return None
    video_id_match = re.search(r'/video/(\d+)', url)
    target_video_id = video_id_match.group(1) if video_id_match else None
    short_match = re.search(r'v\.douyin\.com/(\w+)', url)
    target_short = short_match.group(1) if short_match else None
    if not os.path.exists(MATERIAL_DIR):
        return None
    for mat_id in sorted(os.listdir(MATERIAL_DIR)):
        info_path = os.path.join(MATERIAL_DIR, mat_id, "info.json")
        if not os.path.exists(info_path):
            continue
        with open(info_path, "r", encoding="utf-8") as f:
            info = json.load(f)
        stored_url = info.get("url", "")
        stored_orig = info.get("original_url", "")
        if stored_url == url or stored_orig == url:
            info["id"] = mat_id
            return info
        if target_video_id:
            m = re.search(r'/video/(\d+)', stored_url)
            if m and m.group(1) == target_video_id:
                info["id"] = mat_id
                return info
        if target_short:
            m = re.search(r'v\.douyin\.com/(\w+)', stored_url + stored_orig)
            if m and m.group(1) == target_short:
                info["id"] = mat_id
                return info
    return None


def check_duplicate_url(url_or_text):
    if not url_or_text:
        return None
    if 'http' in url_or_text:
        if url_or_text.strip().startswith('http'):
            return check_duplicate(url=url_or_text.strip())
        return check_duplicate(share_text=url_or_text)
    return check_duplicate(share_text=url_or_text)



def _extract_bilibili(url, parsed):
    """B站视频专用提取流程"""
    url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    material_id = f"{timestamp}_{url_hash}"
    
    audio_path, error, info = bilibili_extract_audio(url, material_id)
    
    if error:
        return {"error": f"B站视频提取失败: {error.get('error', str(error)) if isinstance(error, dict) else str(error)}"}
    
    platform_name = "B站"
    material_info = {
        "title": info.get("title", parsed.get("description", "")[:50]),
        "author": info.get("author", ""),
        "platform": platform_name,
        "platform_raw": "BiliBili",
        "url": info.get("webpage_url", url),
        "original_url": url,
        "duration": info.get("duration", 0),
        "description": info.get("description", ""),
        "thumbnail": info.get("thumbnail", ""),
        "tags": parsed.get("tags", []),
        "mentions": parsed.get("mentions", []),
        "has_video": False,
        "has_audio": audio_path is not None,
        "has_transcript": False,
        "created_at": datetime.now().isoformat(),
    }
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    with open(os.path.join(mat_dir, "info.json"), "w", encoding="utf-8") as f:
        json.dump(material_info, f, ensure_ascii=False, indent=2)
    
    # 转写
    transcript = None
    transcript_error = None
    if audio_path:
        try:
            transcript = transcribe_with_funasr(audio_path)
        except Exception as e:
            transcript_error = f"语音转写失败: {str(e)}"
    
    # 更新info
    material_info["has_transcript"] = transcript is not None
    with open(os.path.join(mat_dir, "info.json"), "w", encoding="utf-8") as f:
        json.dump(material_info, f, ensure_ascii=False, indent=2)
    
    result = {
        "material_id": material_id,
        "url": info.get("webpage_url", url),
        "original_url": url,
        "title": info.get("title", ""),
        "author": info.get("author", ""),
        "platform": platform_name,
        "platform_raw": "BiliBili",
        "duration": info.get("duration", 0),
        "description": info.get("description", ""),
        "thumbnail": info.get("thumbnail", ""),
        "tags": parsed.get("tags", []),
        "mentions": parsed.get("mentions", []),
        "audio_path": audio_path,
        "video_path": None,
        "has_transcript": transcript is not None,
        "transcript_error": transcript_error,
    }
    
    if transcript:
        result["text"] = transcript["text"]
        result["source"] = "funasr"
        result["segments"] = transcript.get("segments", [])
        result["transcript_duration"] = transcript.get("duration", 0)
    else:
        result["text"] = parsed.get("description", info.get("description", ""))
        result["source"] = "description"
        result["warning"] = "语音转写失败，仅返回视频描述。" + (transcript_error or "")
    
    return result


def extract_full_pipeline(share_text=None, url=None, api_key=None):
    parsed = {}
    if share_text:
        parsed = parse_share_text(share_text)
        url = parsed.get("url", "")
    if not url:
        return {"error": "未提供有效的链接，请检查分享文本中是否包含 URL"}

    # B站特殊处理：使用B站API（yt-dlp对B站支持不好）
    if is_bilibili_url(url):
        return _extract_bilibili(url, parsed)
    
    real_url = resolve_short_url(url)
    info = get_video_info(real_url)
    if "error" in info:
        return {"error": f"获取视频信息失败: {info['error']}"}

    url_hash = hashlib.md5(real_url.encode()).hexdigest()[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    material_id = f"{timestamp}_{url_hash}"

    audio_path = None
    try:
        audio_path = download_audio(real_url, material_id)
    except Exception as e:
        return {"error": f"音频下载失败: {str(e)}", "title": info.get("title", ""), "author": info.get("author", "")}

    video_path = None
    try:
        video_path = download_video(real_url, material_id)
    except Exception:
        pass

    transcript = None
    transcript_error = None
    if audio_path:
        try:
            transcript = transcribe_with_funasr(audio_path)
        except Exception as e:
            transcript_error = f"语音转写失败: {str(e)}"

    platform_name = detect_platform(real_url)
    material_info = {
        "title": info.get("title", parsed.get("description", "")[:50]),
        "author": info.get("author", ""),
        "platform": platform_name,
        "platform_raw": info.get("platform", ""),
        "url": real_url,
        "original_url": url,
        "duration": info.get("duration", 0),
        "description": info.get("description", ""),
        "thumbnail": info.get("thumbnail", ""),
        "tags": parsed.get("tags", []),
        "mentions": parsed.get("mentions", []),
        "has_video": video_path is not None,
        "has_audio": audio_path is not None,
        "has_transcript": transcript is not None,
        "created_at": datetime.now().isoformat(),
    }
    mat_dir = os.path.join(MATERIAL_DIR, material_id)
    os.makedirs(mat_dir, exist_ok=True)
    with open(os.path.join(mat_dir, "info.json"), "w", encoding="utf-8") as f:
        json.dump(material_info, f, ensure_ascii=False, indent=2)

    result = {
        "material_id": material_id,
        "url": real_url,
        "original_url": url,
        "title": info.get("title", parsed.get("description", "")[:50]),
        "author": info.get("author", ""),
        "platform": platform_name,
        "platform_raw": info.get("platform", ""),
        "duration": info.get("duration", 0),
        "description": info.get("description", ""),
        "thumbnail": info.get("thumbnail", ""),
        "tags": parsed.get("tags", []),
        "mentions": parsed.get("mentions", []),
        "audio_path": audio_path,
        "video_path": video_path,
        "has_transcript": transcript is not None,
        "transcript_error": transcript_error,
    }

    if transcript:
        result["text"] = transcript["text"]
        result["source"] = "funasr"
        result["segments"] = transcript.get("segments", [])
        result["transcript_duration"] = transcript.get("duration", 0)
    else:
        result["text"] = parsed.get("description", info.get("description", ""))
        result["source"] = "description"
        result["warning"] = "语音转写失败，仅返回视频描述。" + (transcript_error or "")

    return result
