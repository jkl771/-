#!/usr/bin/env python3
"""XTTS v2 本地推理脚本 - 官方推荐参数"""
import argparse, json, os, time, re
import numpy as np

os.environ.setdefault("COQUI_TOS_AGREED", "1")
os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

MAX_CHARS = 200


def get_device():
    try:
        import torch
        if torch.cuda.is_available(): return "cuda"
    except: pass
    return "cpu"


def _patch_torchaudio():
    import torchaudio, torch
    import soundfile as sf
    def _load(fp, **kw):
        d, sr = sf.read(str(fp), dtype="float32")
        if d.ndim == 1: d = d[np.newaxis, :]
        else: d = d.T
        return torch.from_numpy(d), sr
    def _save(fp, t, sr, **kw):
        d = t.T.numpy() if t.ndim == 2 and t.shape[0] <= 2 else (t.numpy() if hasattr(t, "numpy") else np.array(t))
        sf.write(str(fp), d, sr)
    torchaudio.load = _load
    torchaudio.save = _save


def split_text(text, max_chars=MAX_CHARS):
    """按句子边界拆分，返回 (text, pause_sec) 列表"""
    pause_map = {"，": 0.15, ",": 0.15, "。": 0.25, ".": 0.25, "？": 0.3, "?": 0.3, "！": 0.3, "!": 0.3, "；": 0.2, ";": 0.2, "\n": 0.25}
    sentences = re.split(r"([。！？!?.;；,，\n])", text)
    chunks, current = [], ""
    pauses = []
    for seg in sentences:
        if not seg: continue
        if seg in pause_map:
            current += seg
            pauses.append(pause_map[seg])
            continue
        if len(current) + len(seg) > max_chars and current:
            chunks.append(current.strip())
            current = seg
            pauses.append(0.0)
        else:
            current += seg
    if current.strip():
        chunks.append(current.strip())
        pauses.append(0.0)
    # 处理超长段
    result = []
    for idx, c in enumerate(chunks):
        p = pauses[idx] if idx < len(pauses) else 0.0
        while len(c) > max_chars:
            result.append((c[:max_chars], 0.0))
            c = c[max_chars:]
        if c:
            result.append((c, p))
    return result


def convert_to_wav(input_path):
    """转成 22050Hz 单声道 wav"""
    import subprocess
    if input_path.lower().endswith(".wav"):
        # 检查是否已经是目标格式
        import soundfile as sf
        info = sf.info(input_path)
        if info.samplerate == 22050 and info.channels == 1:
            return input_path
    wav_path = input_path.rsplit(".", 1)[0] + "_22k.wav"
    subprocess.run(["ffmpeg", "-y", "-i", input_path, "-ar", "22050", "-ac", "1", wav_path],
                  capture_output=True, check=True)
    return wav_path


def load_model():
    device = get_device()
    _patch_torchaudio()
    print(json.dumps({"status": "loading", "device": device}), flush=True)

    model_dir = os.path.join(os.getcwd(), "tools", "xtts_model")
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts
    config = XttsConfig()
    config.load_json(os.path.join(model_dir, "config.json"))
    model = Xtts.init_from_config(config)
    model.load_checkpoint(config, checkpoint_dir=model_dir)
    model.to(device)
    model.eval()
    print(json.dumps({"status": "ready", "device": device}), flush=True)
    return model


def synthesize(model, text, output, speaker_wav=None, lang="zh", speed=1.0):
    import torch
    import soundfile as sf

    t0 = time.time()

    # 准备参考音频
    if speaker_wav and os.path.exists(speaker_wav):
        ref_audio = convert_to_wav(speaker_wav)
    else:
        ref_audio = os.path.join(os.getcwd(), "tools", "xtts_model", "samples", "zh-cn-sample.wav")

    # 获取音色条件向量 - XTTS 官方推荐参数
    gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(
        audio_path=[ref_audio],
    )

    # 拆分文本
    chunk_pairs = split_text(text, MAX_CHARS)
    sr = 24000

    # 逐段生成
    all_chunks = []
    with torch.inference_mode():
        for i, (chunk_text, pause_sec) in enumerate(chunk_pairs):
            print(json.dumps({"status": "generating", "chunk": i + 1, "total": len(chunk_pairs), "text": chunk_text[:30]}), flush=True)

            out = model.inference(
                text=chunk_text,
                language=lang,
                gpt_cond_latent=gpt_cond_latent,
                speaker_embedding=speaker_embedding,
                # XTTS 官方默认参数
                temperature=0.7,
                speed=speed,
                top_k=50,
                top_p=0.85,
                repetition_penalty=1.0,
                do_sample=True,
            )

            wav = out["wav"]
            if hasattr(wav, "cpu"): wav = wav.cpu().numpy()
            elif not isinstance(wav, np.ndarray): wav = np.array(wav)
            all_chunks.append(wav)

            # 标点停顿
            if pause_sec > 0:
                all_chunks.append(np.zeros(int(sr * pause_sec), dtype=np.float32))

    # 拼接所有段
    final_wav = np.concatenate(all_chunks)

    # 末尾淡出
    fade_len = int(sr * 0.03)
    if len(final_wav) > fade_len:
        final_wav[-fade_len:] *= np.linspace(1.0, 0.0, fade_len, dtype=np.float32)

    sf.write(output, final_wav, sr)

    elapsed = time.time() - t0
    return {"status": "ok", "output": output, "elapsed_sec": round(elapsed, 2),
            "device": get_device(), "chunks": len(chunk_pairs), "gpu": get_device() == "cuda"}


def probe():
    try:
        device = get_device()
        model_dir = os.path.join(os.getcwd(), "tools", "xtts_model")
        has_model = os.path.exists(os.path.join(model_dir, "config.json"))
        gpu_name = None
        if device == "cuda":
            import torch
            gpu_name = torch.cuda.get_device_name(0)
        return {"status": "ok", "device": device, "model": "xtts_v2",
                "gpu": device == "cuda", "gpu_name": gpu_name,
                "model_downloaded": has_model}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")

    p_synth = sub.add_parser("synth")
    p_synth.add_argument("--text", required=True)
    p_synth.add_argument("--output", required=True)
    p_synth.add_argument("--speaker_wav", default=None)
    p_synth.add_argument("--lang", default="zh")
    p_synth.add_argument("--speed", type=float, default=1.0)

    p_clone = sub.add_parser("clone")
    p_clone.add_argument("--text", required=True)
    p_clone.add_argument("--output", required=True)
    p_clone.add_argument("--speaker_wav", required=True)
    p_clone.add_argument("--lang", default="zh")
    p_clone.add_argument("--speed", type=float, default=1.0)

    sub.add_parser("probe")

    args = parser.parse_args()
    if args.cmd == "probe":
        print(json.dumps(probe())); return

    model = load_model()
    if args.cmd in ("synth", "clone"):
        result = synthesize(model, args.text, args.output, args.speaker_wav, args.lang, args.speed)
        print(json.dumps(result))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()