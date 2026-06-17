const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 1. 添加 BGM 相关 state
if (!content.includes('bgmSearching')) {
    content = content.replace(
        'const [showProbe, setShowProbe] = useState(false);',
        'const [showProbe, setShowProbe] = useState(false); const [bgmSearching, setBgmSearching] = useState(false); const [previewBgm, setPreviewBgm] = useState(null); const bgmAudioRef = useRef(null);'
    );
    console.log('Added BGM states');
}

// 2. 修改 BGM 搜索框：添加搜索按钮
const oldBgmInput = 'placeholder="搜索背景音乐" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)}';
const newBgmInput = 'placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} /><button onClick={async () => { setBgmSearching(true); try { const r = await fetch("/api/bgm?source=builtin"); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="px-3 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition">{bgmSearching ? "..." : "搜索"}</button>';
if (content.includes(oldBgmInput)) {
    content = content.replace(oldBgmInput, newBgmInput);
    console.log('Added BGM search button');
}

// 3. 修改 BGM 列表：添加试听按钮
const oldBgmItem = '<div className="font-medium text-gray-800">{b.name}</div>\n                      <div className="text-gray-400">{b.category}{b.artist ? \' · \' + b.artist : \'\'}</div>';
const newBgmItem = '<div className="flex items-center justify-between"><div><div className="font-medium text-gray-800">{b.name}</div><div className="text-gray-400">{b.category}{b.artist ? " · " + b.artist : ""}</div></div><button onClick={(e) => { e.stopPropagation(); if (previewBgm === b.url) { bgmAudioRef.current?.pause(); setPreviewBgm(null); } else { setPreviewBgm(b.url); setTimeout(() => bgmAudioRef.current?.play().catch(() => {}), 100); } }} className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1">{previewBgm === b.url ? "⏸" : "▶"}</button></div>';
if (content.includes('<div className="font-medium text-gray-800">{b.name}</div>')) {
    content = content.replace(
        /<div className="font-medium text-gray-800">\{b\.name\}<\/div>\s*<div className="text-gray-400">\{b\.category\}\{b\.artist \? ' · ' \+ b\.artist : ''\}<\/div>/,
        newBgmItem
    );
    console.log('Added BGM preview button');
}

// 4. 在 footer 前添加 bgmAudio 元素
const footerText = `{'声音工作台 · 支持 Edge TTS / ElevenLabs / CosyVoice'}`;
if (!content.includes('bgmAudioRef')) {
    content = content.replace(
        footerText,
        `{previewBgm && <audio ref={bgmAudioRef} src={previewBgm} onEnded={() => setPreviewBgm(null)} />}` + footerText
    );
    console.log('Added bgmAudio element');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
