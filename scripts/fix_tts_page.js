const fs = require('fs');
const code = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx.bak', 'utf-8');

let result = code;

// 1. 添加新 state
result = result.replace(
  'const [probing, setProbing] = useState(false);',
  'const [probing, setProbing] = useState(false); const [showProbe, setShowProbe] = useState(false); const [bgmSearching, setBgmSearching] = useState(false); const [previewBgm, setPreviewBgm] = useState(null); const bgmAudioRef = useRef(null);'
);

// 2. 探测按钮改为 toggle
result = result.replace(
  "{probing ? '\u63A2\u6D4B\u4E2D...' : '\uD83D\uDD0D \u63A2\u6D4B\u53EF\u7528\u97F3\u6E90'}",
  "{probing ? '\u63A2\u6D4B\u4E2D...' : showProbe ? '\u6536\u8D77\u63A2\u6D4B' : '\uD83D\uDD0D \u63A2\u6D4B\u53EF\u7528\u97F3\u6E90'}"
);
result = result.replace(
  'onClick={handleProbe} disabled={probing}',
  'onClick={() => { if (showProbe) { setShowProbe(false); } else { setShowProbe(true); handleProbe(); } }} disabled={probing}'
);

// 3. 探测结果包裹在 showProbe
result = result.replace(
  '{probeResults.length > 0 && (',
  '{showProbe && probeResults.length > 0 && ('
);

// 4. BGM 搜索框改为带搜索按钮
const oldInput = 'placeholder="\u641C\u7D22\u80CC\u666F\u97F3\u4E50" value={bgmQuery} onChange={e => setBgmQuery(e.target.value)}';
const newInput = 'placeholder="\u8F93\u5165\u5173\u952E\u8BCD\u641C\u7D22 BGM" value={bgmQuery} onChange={e => setBgmQuery(e.target.value)}';
result = result.replace(oldInput, newInput);

// 5. BGM 列表加试听按钮
const oldItem = '<span className="font-medium text-gray-800">{b.name}</span> <span className="text-gray-400 ml-2">{b.category}</span>';
const newItem = '<div className="flex items-center justify-between w-full"><div><span className="font-medium text-gray-800">{b.name}</span> <span className="text-gray-400 ml-2">{b.category}</span></div><button onClick={(e) => { e.stopPropagation(); if (previewBgm === b.url) { bgmAudioRef.current?.pause(); setPreviewBgm(null); } else { setPreviewBgm(b.url); setTimeout(() => bgmAudioRef.current?.play().catch(() => {}), 100); } }} className="text-xs text-violet-600 hover:text-violet-800 ml-2 px-2">{previewBgm === b.url ? "\u23F8" : "\u25B6"}</button></div>';
result = result.replace(oldItem, newItem);

// 6. footer 前加 bgmAudio
result = result.replace(
  '\u58F0\u97F3\u5DE5\u4F5C\u53F0 \u00B7 Edge TTS / CosyVoice / ElevenLabs</footer>',
  '{previewBgm && <audio ref={bgmAudioRef} src={previewBgm} onEnded={() => setPreviewBgm(null)} />}\u58F0\u97F3\u5DE5\u4F5C\u53F0 \u00B7 Edge TTS / CosyVoice / ElevenLabs</footer>'
);

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', result, 'utf-8');
console.log('Written ' + result.length + ' chars');
