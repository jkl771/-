const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 修复 BGM 搜索框布局
const oldBgm = `<input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} /><button onClick={async () => { setBgmSearching(true); try { const r = await fetch("/api/bgm?source=builtin"); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="px-3 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition">{bgmSearching ? "..." : "搜索"}</button> />`;

const newBgm = `<div className="flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />
                <button onClick={async () => { setBgmSearching(true); try { const r = await fetch("/api/bgm?source=builtin"); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition whitespace-nowrap">{bgmSearching ? "..." : "搜索"}</button>
                </div>`;

if (content.includes(oldBgm)) {
    content = content.replace(oldBgm, newBgm);
    console.log('Fixed BGM layout');
} else {
    console.log('Old BGM not found');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
