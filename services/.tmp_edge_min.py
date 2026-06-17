import asyncio, sys, edge_tts, os
text = sys.argv[1]
voice = sys.argv[2]
out = sys.argv[3]
rate = sys.argv[4]
pitch = sys.argv[5]
volume = sys.argv[6]

async def main():
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume)
    await comm.save(out)

asyncio.run(main())
