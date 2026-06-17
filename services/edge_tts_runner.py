import sys
import asyncio
import edge_tts
import os

VOICE_MAP = {
    "xiaoxiao": "zh-CN-XiaoxiaoNeural", "yunxi": "zh-CN-YunxiNeural",
    "yunyang": "zh-CN-YunyangNeural", "xiaoyi": "zh-CN-XiaoyiNeural",
    "xiaoxuan": "zh-CN-XiaoxuanNeural", "yunjian": "zh-CN-YunjianNeural",
    "hiugaai": "zh-HK-HiuGaaiNeural", "hiumaan": "zh-HK-HiuMaanNeural",
    "wanlung": "zh-HK-WanLungNeural",
}

async def main():
    # Support --text-file flag for UTF-8 text input (avoids shell encoding issues)
    text = ""
    voice_key = "xiaoxiao"
    output = "output.mp3"
    rate = "+0%"
    pitch = "+0Hz"
    volume = "+0%"

    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == "--text-file" and i + 1 < len(args):
            with open(args[i + 1], "r", encoding="utf-8") as f:
                text = f.read().strip()
            i += 2
        elif args[i] == "--voice" and i + 1 < len(args):
            voice_key = args[i + 1]
            i += 2
        elif args[i] == "--output" and i + 1 < len(args):
            output = args[i + 1]
            i += 2
        elif args[i] == "--rate" and i + 1 < len(args):
            rate = args[i + 1]
            i += 2
        elif args[i] == "--pitch" and i + 1 < len(args):
            pitch = args[i + 1]
            i += 2
        elif args[i] == "--volume" and i + 1 < len(args):
            volume = args[i + 1]
            i += 2
        elif i == 0 and not args[i].startswith("--"):
            # Legacy positional args: text voice output rate pitch volume
            text = args[0]
            voice_key = args[1] if len(args) > 1 else "xiaoxiao"
            output = args[2] if len(args) > 2 else "output.mp3"
            rate = args[3] if len(args) > 3 and args[3] else "+0%"
            pitch = args[4] if len(args) > 4 and args[4] else "+0Hz"
            volume = args[5] if len(args) > 5 and args[5] else "+0%"
            break
        else:
            i += 1

    if not text:
        print("Error: no text provided", file=sys.stderr)
        sys.exit(1)

    voice = VOICE_MAP.get(voice_key, voice_key)
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume)
    await comm.save(output)

if __name__ == "__main__":
    asyncio.run(main())
