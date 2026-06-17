const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 在第一个 <section 前添加音源选择器
const firstSection = '<section className="lg:col-span-1 card space-y-4">';
if (content.includes(firstSection)) {
    const modeTabs = `
        {/* === 音源选择器 === */}
        <div className="flex gap-3">
          <button onClick={() => setTtsMode('edge')} className={'flex-1 p-4 rounded-2xl border-2 transition text-left ' + (ttsMode === 'edge' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🆓</span>
              <span className="font-bold text-sm text-gray-800">免费预设</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">免费</span>
            </div>
            <p className="text-xs text-gray-400">Edge TTS 预设音色，无需配置，完全免费</p>
          </button>
          <button onClick={() => setTtsMode('cosy-clone')} className={'flex-1 p-4 rounded-2xl border-2 transition text-left ' + (ttsMode === 'cosy-clone' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧬</span>
              <span className="font-bold text-sm text-gray-800">克隆音色</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">克隆</span>
            </div>
            <p className="text-xs text-gray-400">阿里云 CosyVoice 克隆你的声音，需配置 DashScope Key</p>
          </button>
          <button onClick={() => setTtsMode('elevenlabs')} className={'flex-1 p-4 rounded-2xl border-2 transition text-left ' + (ttsMode === 'elevenlabs' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌍</span>
              <span className="font-bold text-sm text-gray-800">ElevenLabs</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">付费</span>
            </div>
            <p className="text-xs text-gray-400">海外顶级 TTS，需配置 ElevenLabs Key</p>
          </button>
        </div>
        `;
    
    content = content.replace(firstSection, modeTabs + '\n        ' + firstSection);
    console.log('Added mode tabs');
} else {
    console.log('First section not found');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
