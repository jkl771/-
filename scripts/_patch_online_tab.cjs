const fs = require("fs");
const p = "C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx";
let c = fs.readFileSync(p, "utf8");

// 1. Add new state variables for online search
const stateNeedle = "const [bgmQuery, setBgmQuery] = useState('');";
const stateReplace = "const [bgmQuery, setBgmQuery] = useState('');\n  const [onlineQuery, setOnlineQuery] = useState('');\n  const [onlineResults, setOnlineResults] = useState<BgmItem[]>([]);\n  const [onlineLoading, setOnlineLoading] = useState(false);\n  const [onlineError, setOnlineError] = useState('');\n  const [downloadingId, setDownloadingId] = useState<string | null>(null);\n  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());";
if (c.includes(stateNeedle) && !c.includes("onlineQuery")) {
  c = c.replace(stateNeedle, stateReplace);
}

// 2. Add search and download functions after the fetchBgmItems function
const fetchEnd = "  async function handleUploadBgm(e: React.ChangeEvent<HTMLInputElement>) {";
const funcs = `
  async function searchOnline(q: string) {
    if (!q.trim()) return;
    setOnlineLoading(true); setOnlineError(''); setOnlineResults([]);
    try {
      const res = await fetch('/api/bgm?source=ccmixter&q=' + encodeURIComponent(q.trim()) + '&limit=20');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '\u641c\u7d22\u5931\u8d25');
      setOnlineResults((data?.data || []).filter((x: BgmItem) => x.source === 'ccmixter'));
    } catch (e: any) { setOnlineError(e?.message || '\u641c\u7d22\u5931\u8d25'); } finally { setOnlineLoading(false); }
  }
  async function importToLibrary(item: BgmItem) {
    setDownloadingId(item.id); setOnlineError('');
    try {
      const res = await fetch('/api/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: item.url, name: item.name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '\u5bfc\u5165\u5931\u8d25');
      setDownloadedIds(prev => new Set([...prev, item.id]));
      if (data?.data?.url) { setSelectedBgmUrl(data.data.url); setSelectedBgmName(item.name); }
      await fetchBgmItems('library','');
    } catch (e: any) { setOnlineError(e?.message || '\u5bfc\u5165\u5931\u8d25'); } finally { setDownloadingId(null); }
  }
  function stopOnlinePreview() { if (previewRef.current) { previewRef.current.pause(); previewRef.current.src = ''; } setPreviewUrl(''); }
  function previewOnline(item: BgmItem) {
    stopPreview(); stopOnlinePreview();
    setPreviewUrl(item.url);
    requestAnimationFrame(() => { const el = previewRef.current; if (el) { el.volume = Math.min(1, bgmVolume); el.src = item.url; el.play().catch(()=>{}); } });
  }

  ` + fetchEnd;
if (c.includes(fetchEnd) && !c.includes("searchOnline")) {
  c = c.replace(fetchEnd, funcs);
}

// 3. Replace the online tab content
const onlineOld = `{bgmTab==='online' && <div className="space-y-3">
  <div className="text-xs text-gray-500">
    <p className="mb-2">{'\u5728 ccMixter \u641c\u7d22\u514d\u8d39\u97f3\u4e50\uff0c\u7136\u540e\u590d\u5236\u94fe\u63a5\u5230\u4e0a\u4f20\u533a\u4f7f\u7528\u3002'}</p>
    <a href="https://ccmixter.org/search?query=happy&type=upload" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline">{'\u6253\u5f00 ccMixter \u641c\u7d22\u9875\u9762'}</a>
  </div>
  <div className="flex flex-wrap gap-1.5">
    {['happy','chill','ambient','upbeat','sad','epic','jazz','lo-fi'].map(tag=>(
      <a key={tag} href={'https://ccmixter.org/search?query=' + tag + '&type=upload'} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all">{tag}</a>
    ))}
  </div>
  <div className="text-[11px] text-gray-400">{'\u6b65\u9aa4\uff1a1.\u70b9\u51fb\u4e0a\u65b9\u94fe\u63a5\u641c\u7d22 \u2192 2.\u627e\u5230\u559c\u6b22\u7684\u97f3\u4e50 \u2192 3.\u590d\u5236 MP3 \u94fe\u63a5 \u2192 4.\u7c98\u8d34\u5230\u4e0a\u4f20\u533a\u7684 URL \u8f93\u5165\u6846'}</div>
</div>}`;

const onlineNew = `{bgmTab==='online' && <div className="space-y-3">
  <div className="flex gap-2">
    <input value={onlineQuery} onChange={e=>setOnlineQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchOnline(onlineQuery);}} placeholder={"\u641c\u7d22 happy\u3001chill\u3001ambient\u7b49..."} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
    <button onClick={()=>searchOnline(onlineQuery)} disabled={onlineLoading} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium transition">{onlineLoading?'\u641c\u7d22\u4e2d...':'\u641c\u7d22'}</button>
  </div>
  <div className="flex flex-wrap gap-1.5">
    {['happy','chill','ambient','upbeat','sad','epic','jazz','lo-fi'].map(tag=>(
      <button key={tag} onClick={()=>{setOnlineQuery(tag);searchOnline(tag);}} className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all">{tag}</button>
    ))}
  </div>
  {onlineError && <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{onlineError}</div>}
  {onlineLoading && <div className="text-center text-xs text-gray-400 py-4">{"\u6b63\u5728\u641c\u7d22..."}</div>}
  {!onlineLoading && onlineResults.length > 0 && <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
    {onlineResults.map(item=>(
      <div key={item.id} className="rounded-xl bg-gray-50 border border-transparent hover:border-violet-200 transition-all">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-xs truncate">{item.name}</div>
            <div className="text-[10px] text-gray-400 truncate">{item.artist||'ccMixter'}{item.tags?.length ? ' \u00b7 '+item.tags.slice(0,3).join(', ') : ''}</div>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button onClick={()=>previewUrl===item.url ? (stopPreview(),stopOnlinePreview()) : previewOnline(item)} className="text-[10px] px-2 py-1 rounded-lg text-violet-600 hover:bg-violet-50 transition">{previewUrl===item.url?'\u23f9 \u505c\u6b62':'\u25b6 \u8bd5\u542c'}</button>
            {downloadedIds.has(item.id) ? <span className="text-[10px] px-2 py-1 text-emerald-600">\u2713 \u5df2\u5165\u5e93</span> :
              <button onClick={()=>importToLibrary(item)} disabled={downloadingId===item.id} className="text-[10px] px-2 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50">{downloadingId===item.id?'\u5bfc\u5165\u4e2d...':'\u2b07 \u5165\u5e93'}</button>}
          </div>
        </div>
      </div>
    ))}
  </div>}
  {!onlineLoading && onlineResults.length === 0 && onlineQuery && !onlineError && <div className="text-center text-xs text-gray-300 py-6">{"\u65e0\u7ed3\u679c\uff0c\u8bd5\u8bd5\u5176\u4ed6\u5173\u952e\u8bcd"}</div>}
  {!onlineLoading && !onlineQuery && <div className="text-[11px] text-gray-400 text-center py-2">{"\u8f93\u5165\u5173\u952e\u8bcd\u641c\u7d22\uff0c\u70b9\u51fb\u8bd5\u542c\u5373\u53ef\u64ad\u653e\uff0c\u70b9\u51fb\u5165\u5e93\u4fdd\u5b58\u5230\u672c\u5730\u97f3\u4e50\u5e93"}</div>}
</div>}`;

if (c.includes(onlineOld)) {
  c = c.replace(onlineOld, onlineNew);
  console.log("patched-online-tab");
} else {
  console.log("online-old-not-found");
}

fs.writeFileSync(p, c, "utf8");
console.log("done");