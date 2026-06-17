const fs = require('fs');
const p = 'app/tts/page.tsx';
let s = fs.readFileSync(p, 'utf-8');
// 在线搜索区改为提供链接和手动粘贴
const oldOnline = `{bgmTab==='online' && <div className="space-y-2"><div className="flex flex-wrap gap-1.5 mb-1">{ONLINE_TAGS.map(tag=>(<button key={tag} onClick={()=>{setBgmQuery(tag);fetchBgmItems('ccmixter',tag);}} className={'text-[10px] px-2 py-1 rounded-full border transition-all '+(bgmQuery===tag?'border-violet-400 bg-violet-50 text-violet-700':'border-gray-200 text-gray-500 hover:border-violet-300')}>{tag}</button>))}</div><div className="flex gap-2"><input value={bgmQuery} onChange={e=>setBgmQuery(e.target.value)} placeholder={"\u8f93\u5165\u5173\u952e\u8bcd\u641c\u7d22 ccMixter (CC \u534f\u8bae) \u514d\u8d39\u66f2\u5e93"} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" /><button onClick={()=>fetchBgmItems('ccmixter',bgmQuery)} className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs">{'\u641c\u7d22'}</button></div>{bgmError&&<div className="text-xs text-red-500">{bgmError}</div>}<div className="grid grid-cols-1 gap-1.5 max-h-[260px] overflow-y-auto">{filteredOnline.map(item=>(<div key={item.id} className="rounded-xl bg-gray-50 border border-transparent px-3 py-2 text-xs"><div className="flex items-center justify-between"><div className="min-w-0"><div className="font-semibold text-gray-800 truncate">{item.name}</div><div className="text-[10px] text-gray-400 truncate">{item.artist||'\u672a\u77e5\u4f5c\u8005'} \u00b7 {(item.tags||[]).slice(0,3).join(' / ')||'ccMixter'}</div></div><div className="flex items-center gap-2 shrink-0"><button onClick={()=>preview(item)} className="text-[10px] text-violet-600">{previewUrl===item.url?'\u23F9 \u505c\u6b62':'\u25B6 \u8bd5\u542c'}</button><button onClick={()=>downloadAndUse(item)} className="text-[10px] text-emerald-600">{'\u4e0b\u8f7d\u5e76\u4f7f\u7528'}</button></div></div></div>))}{filteredOnline.length===0&&<div className="text-center text-xs text-gray-300 py-6">{'\u8f93\u5165\u5173\u952e\u8bcd\u5373\u53ef\u641c\u7d22\u5728\u7ebf\u514d\u8d39 BGM\u3002'}</div>}</div></div>}`;
const newOnline = `{bgmTab==='online' && <div className="space-y-3">
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
s = s.replace(oldOnline, newOnline);
// 添加 URL 粘贴功能到上传区
const oldUpload = `{bgmTab==='upload' && <div className="space-y-3"><label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-sm text-gray-400"><span>{'\u62d6\u62fd\u6216\u70b9\u51fb\u4e0a\u4f20 MP3/WAV/OGG'}</span><input type="file" accept=".mp3,.wav,.ogg" className="hidden" onChange={handleUploadBgm} /></label><div className="text-[11px] text-gray-400">{'\u4e0a\u4f20\u540e\u4f1a\u81ea\u52a8\u4fdd\u5b58\u5230\u672c\u5730\u97f3\u4e50\u5e93\uff0c\u540e\u7eed\u53ef\u76f4\u63a5\u5728\u201c\u97f3\u4e50\u5e93\u201d\u9875\u7b7e\u53cd\u590d\u4f7f\u7528\u3002'}</div></div>}`;
const newUpload = `{bgmTab==='upload' && <div className="space-y-3">
  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-sm text-gray-400">
    <span>{'\u62d6\u62fd\u6216\u70b9\u51fb\u4e0a\u4f20 MP3/WAV/OGG'}</span>
    <input type="file" accept=".mp3,.wav,.ogg" className="hidden" onChange={handleUploadBgm} />
  </label>
  <div className="text-xs text-gray-500 font-medium">{'\u6216\u8005\u7c98\u8d34\u97f3\u4e50 URL\uff1a'}</div>
  <div className="flex gap-2">
    <input 
      type="url" 
      placeholder="https://example.com/music.mp3" 
      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" 
      onKeyDown={async (e) => {
        if (e.key === 'Enter') {
          const url = (e.target as HTMLInputElement).value;
          if (url) {
            try {
              setBgmLoading(true);
              setBgmError('');
              const res = await fetch('/api/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, name: 'url-bgm' }) });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || '\u4e0b\u8f7d\u5931\u8d25');
              setSelectedBgmUrl(data?.data?.url);
              setSelectedBgmName('URL BGM');
              await fetchBgmItems('library', '');
              (e.target as HTMLInputElement).value = '';
            } catch (e: any) {
              setBgmError(e?.message || '\u4e0b\u8f7d\u5931\u8d25');
            } finally {
              setBgmLoading(false);
            }
          }
        }
      }}
    />
    <button 
      onClick={async () => {
        const input = document.querySelector('input[type="url"]') as HTMLInputElement;
        const url = input?.value;
        if (url) {
          try {
            setBgmLoading(true);
            setBgmError('');
            const res = await fetch('/api/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, name: 'url-bgm' }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || '\u4e0b\u8f7d\u5931\u8d25');
            setSelectedBgmUrl(data?.data?.url);
            setSelectedBgmName('URL BGM');
            await fetchBgmItems('library', '');
            input.value = '';
          } catch (e: any) {
            setBgmError(e?.message || '\u4e0b\u8f7d\u5931\u8d25');
          } finally {
            setBgmLoading(false);
          }
        }
      }}
      className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs"
    >
      {'\u4e0b\u8f7d'}
    </button>
  </div>
  <div className="text-[11px] text-gray-400">{'\u4e0a\u4f20\u6216\u4e0b\u8f7d\u540e\u4f1a\u81ea\u52a8\u4fdd\u5b58\u5230\u672c\u5730\u97f3\u4e50\u5e93\uff0c\u540e\u7eed\u53ef\u76f4\u63a5\u5728\u201c\u97f3\u4e50\u5e93\u201d\u9875\u7b7e\u53cd\u590d\u4f7f\u7528\u3002'}</div>
</div>}`;
s = s.replace(oldUpload, newUpload);
fs.writeFileSync(p, s, 'utf-8');
console.log('added-url-download');
