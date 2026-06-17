const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 外层 button 改成 div
const oldItem = `<button key={b.id} className={'w-full text-left p-2 rounded-lg text-xs ' + (bgmFile === b.url ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50 hover:bg-gray-100')} onClick={() => setBgmFile(b.url)}>
                      <div className="flex items-center justify-between"><div><div className="font-medium text-gray-800">{b.name}</div><div className="text-gray-400">{b.category}{b.artist ? " · " + b.artist : ""}</div></div><button onClick={(e) => { e.stopPropagation(); if (previewBgm === b.url) { bgmAudioRef.current?.pause(); setPreviewBgm(null); } else { setPreviewBgm(b.url); setTimeout(() => bgmAudioRef.current?.play().catch(() => {}), 100); } }} className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1">{previewBgm === b.url ? "暂停" : "试听"}</button></div>
                    </button>`;

const newItem = `<div key={b.id} className={'flex items-center justify-between p-2 rounded-lg text-xs ' + (bgmFile === b.url ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50 hover:bg-gray-100')}>
                      <button className="flex-1 text-left" onClick={() => setBgmFile(b.url)}>
                        <div className="font-medium text-gray-800">{b.name}</div>
                        <div className="text-gray-400">{b.category}{b.artist ? " · " + b.artist : ""}</div>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (previewBgm === b.url) { bgmAudioRef.current?.pause(); setPreviewBgm(null); } else { setPreviewBgm(b.url); setTimeout(() => bgmAudioRef.current?.play().catch(() => {}), 100); } }} className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1 ml-2">{previewBgm === b.url ? "⏸" : "▶"}</button>
                    </div>`;

if (content.includes(oldItem)) {
    content = content.replace(oldItem, newItem);
    console.log('Fixed BGM item: button -> div');
} else {
    console.log('Old BGM item not found');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
