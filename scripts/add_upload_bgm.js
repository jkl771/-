const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 1. 添加上传 BGM 的 state
if (!content.includes('uploadingBgm')) {
    content = content.replace(
        'const [bgmSearching, setBgmSearching] = useState(false);',
        'const [bgmSearching, setBgmSearching] = useState(false); const [uploadingBgm, setUploadingBgm] = useState(false);'
    );
    console.log('Added uploadingBgm state');
}

// 2. 添加上传 BGM 的函数
const uploadFunction = `
  async function handleUploadBgm(file: File) {
    setUploadingBgm(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\\.[^.]+$/, ''));
      const r = await fetch('/api/bgm', { method: 'POST', body: formData });
      const d = await r.json();
      if (d?.success) {
        setBgmItems(prev => [...prev, d.data]);
        setBgmFile(d.data.url);
      } else {
        alert(d?.error || '上传失败');
      }
    } catch (e) {
      alert('上传失败: ' + e.message);
    } finally {
      setUploadingBgm(false);
    }
  }
`;

if (!content.includes('handleUploadBgm')) {
    content = content.replace(
        'async function handleSynthesize()',
        uploadFunction + '  async function handleSynthesize()'
    );
    console.log('Added upload BGM function');
}

// 3. 在 BGM 搜索框旁边添加上传按钮
const oldBgmSearch = '<div className="flex gap-2">\n                  <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />\n                  <button onClick={async () => { setBgmSearching(true); try { const r = await fetch(\'/api/bgm?source=builtin\'); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition whitespace-nowrap">{bgmSearching ? \'...\' : \'搜索\'}</button>\n                </div>';

const newBgmSearch = `<div className="flex gap-2">
                  <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />
                  <button onClick={async () => { setBgmSearching(true); try { const r = await fetch('/api/bgm?source=builtin'); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition whitespace-nowrap">{bgmSearching ? '...' : '搜索'}</button>
                  <label className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs hover:bg-emerald-600 transition whitespace-nowrap cursor-pointer">
                    {uploadingBgm ? '...' : '上传'}
                    <input type="file" accept=".mp3,.wav,.ogg" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUploadBgm(file); }} />
                  </label>
                </div>`;

if (content.includes(oldBgmSearch)) {
    content = content.replace(oldBgmSearch, newBgmSearch);
    console.log('Added upload BGM button');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
