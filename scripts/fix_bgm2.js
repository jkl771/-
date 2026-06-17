const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 替换搜索按钮的 onClick：先本地再在线
const oldSearch = 'setBgmSearching(true); try { const r = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery)); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); }';
const newSearch = 'setBgmSearching(true); try { const r1 = await fetch("/api/bgm?source=builtin"); const d1 = await r1.json(); if (d1?.success) setBgmItems(d1.data); const r2 = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery) + "&source=ccmixter"); const d2 = await r2.json(); if (d2?.success) setBgmItems(prev => [...(d1?.success ? d1.data : []), ...d2.data]); } catch {} finally { setBgmSearching(false); }';

content = content.replace(oldSearch, newSearch);
fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Updated search to two-phase loading');
