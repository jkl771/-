const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 替换 BGM input+button 为 flex 布局
const oldBgm = `<input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />
                <button onClick={async () => { setBgmSearching(true); try { const r1 = await fetch("/api/bgm?source=builtin"); const d1 = await r1.json(); const localItems = d1?.success ? d1.data : []; setBgmItems(localItems); const r2 = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery) + "&source=ccmixter"); const d2 = await r2.json(); if (d2?.success) setBgmItems([...localItems, ...d2.data]); } catch {} finally { setBgmSearching(false); } }} className="mt-2 w-full px-3 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition">{bgmSearching ? "搜索中..." : "搜索在线 BGM"}</button>`;

const newBgm = `<div className="flex gap-2">
                <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />
                <button onClick={async () => { setBgmSearching(true); try { const r1 = await fetch("/api/bgm?source=builtin"); const d1 = await r1.json(); const localItems = d1?.success ? d1.data : []; setBgmItems(localItems); const r2 = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery) + "&source=ccmixter"); const d2 = await r2.json(); if (d2?.success) setBgmItems([...localItems, ...d2.data]); } catch {} finally { setBgmSearching(false); } }} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition whitespace-nowrap">{bgmSearching ? "..." : "搜索"}</button>
                </div>`;

if (content.includes(oldBgm)) {
    content = content.replace(oldBgm, newBgm);
    console.log('Fixed BGM layout');
} else {
    console.log('Old BGM not found');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done, length:', content.length);
