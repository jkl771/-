const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 在 footer 前添加 bgmAudio 元素
const footerText = `{'声音工作台 · 支持 Edge TTS / ElevenLabs / CosyVoice'}`;
if (!content.includes('bgmAudioRef')) {
    console.log('bgmAudioRef not found in content');
} else if (content.includes('<audio ref={bgmAudioRef}')) {
    console.log('bgmAudio already exists');
} else {
    content = content.replace(
        footerText,
        `{previewBgm && <audio ref={bgmAudioRef} src={previewBgm} onEnded={() => setPreviewBgm(null)} />}` + footerText
    );
    console.log('Added bgmAudio element before footer');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
