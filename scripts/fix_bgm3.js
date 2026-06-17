const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 修正搜索逻辑：先本地，再在线追加
const old = 'setBgmSearching(true); try { const r1 = await fetch("/api/bgm?source=builtin"); const d1 = await r1.json(); if (d1?.success) setBgmItems(d1.data); const r2 = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery) + "&source=ccmixter"); const d2 = await r2.json(); if (d2?.success) setBgmItems(prev => [...(d1?.success ? d1.data : []), ...d2.data]); } catch {} finally { setBgmSearching(false); }';
const fixed = 'setBgmSearching(true); try { const r1 = await fetch("/api/bgm?source=builtin"); const d1 = await r1.json(); const localItems = d1?.success ? d1.data : []; setBgmItems(localItems); const r2 = await fetch("/api/bgm?q=" + encodeURIComponent(bgmQuery) + "&source=ccmixter"); const d2 = await r2.json(); if (d2?.success) setBgmItems([...localItems, ...d2.data]); } catch {} finally { setBgmSearching(false); }';

content = content.replace(old, fixed);
fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Fixed search logic');
