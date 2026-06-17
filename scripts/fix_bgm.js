const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 1. BGM 输入框改为带搜索按钮
const oldInput = 'placeholder="搜索背景音乐" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />';
const newInput = 'placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />\n                <button onClick={async () => { setBgmSearching(true); try { const r = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery)); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="mt-2 w-full px-3 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition">{bgmSearching ? "搜索中..." : "搜索在线 BGM"}</button>';

if (content.includes(oldInput)) {
    content = content.replace(oldInput, newInput);
    console.log('Added BGM search button');
} else {
    console.log('Old BGM input not found');
}

// 2. BGM 列表加试听按钮
const oldItem = '<div className="font-medium text-gray-800">{b.name}</div>\n                      <div className="text-gray-400">{b.category}{b.artist ? \' · \' + b.artist : \'\'}</div>';
const newItem = '<div className="flex items-center justify-between"><div><div className="font-medium text-gray-800">{b.name}</div><div className="text-gray-400">{b.category}{b.artist ? " · " + b.artist : ""}</div></div><button onClick={(e) => { e.stopPropagation(); if (previewBgm === b.url) { bgmAudioRef.current?.pause(); setPreviewBgm(null); } else { setPreviewBgm(b.url); setTimeout(() => bgmAudioRef.current?.play().catch(() => {}), 100); } }} className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1">{previewBgm === b.url ? "暂停" : "试听"}</button></div>';

if (content.includes('<div className="font-medium text-gray-800">{b.name}</div>')) {
    content = content.replace(
        /<div className="font-medium text-gray-800">\{b\.name\}<\/div>\s*<div className="text-gray-400">\{b\.category\}\{b\.artist \? ' · ' \+ b\.artist : ''\}<\/div>/,
        newItem
    );
    console.log('Added BGM preview button');
}

// 3. footer 前加 bgmAudio
const footerText = '声音工作台 · Edge TTS / CosyVoice / ElevenLabs</footer>';
if (content.includes(footerText) && !content.includes('bgmAudioRef')) {
    content = content.replace(
        footerText,
        '{previewBgm && <audio ref={bgmAudioRef} src={previewBgm} onEnded={() => setPreviewBgm(null)} />}声音工作台 · Edge TTS / CosyVoice / ElevenLabs</footer>'
    );
    console.log('Added bgmAudio element');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done, length:', content.length);
