const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/api/tts/route.ts', 'utf-8');

// 1. 修复 bgmVolume 默认值
content = content.replace('bgmVolume: Number(body.bgmVolume) || 0.65', 'bgmVolume: Number(body.bgmVolume) || 0.15');
console.log('Fixed bgmVolume default');

// 2. 给 edge 合成加 try/catch + 自动降级
const oldEdge = `result = await synthesizeEdge({ text, voiceKey: edgeVoiceKey, speed: Number(body.speed) || 1, pitch: Number(body.pitch) || 0, emotion: edgeEmotion, bgmFile: bgmFilePath, bgmVolume: Number(body.bgmVolume) || 0.15 });`;
const newEdge = `try {
            result = await synthesizeEdge({ text, voiceKey: edgeVoiceKey, speed: Number(body.speed) || 1, pitch: Number(body.pitch) || 0, emotion: edgeEmotion, bgmFile: bgmFilePath, bgmVolume: Number(body.bgmVolume) || 0.15 });
          } catch (edgeErr) {
            console.warn('[TTS] Edge TTS failed, trying fallback:', edgeErr.message);
            try {
              const fbKey = userApiKey || getApiKey();
              if (fbKey) {
                result = await synthesizeCosyVoice({ text, apiKey: fbKey });
                autoSwitch = true;
                autoNote = 'Edge TTS 失败，已自动切换到阿里云 CosyVoice';
              } else {
                result = await synthesizeSapi({ text, voiceKey: 'huihui' });
                autoSwitch = true;
                autoNote = 'Edge TTS 失败，已自动切换到本地语音';
              }
            } catch (fbErr) {
              throw edgeErr;
            }
          }`;
content = content.replace(oldEdge, newEdge);
console.log('Added edge auto-fallback');

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/api/tts/route.ts', content, 'utf-8');
console.log('Done');
