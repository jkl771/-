'use client';
import { useState, useEffect, useRef } from 'react';
interface ClonedVoice { id: string; name: string; voiceId: string; source: string; createdAt: string; }
interface ElVoice { key: string; label: string; desc: string; }
interface EdgeVoice { key: string; label: string; desc: string; gender: string; style: string; }
interface BgmItem { id: string; name: string; category: string; source: string; url: string; artist?: string; tags?: string[]; }
const EDGE_FALLBACK: EdgeVoice[] = [
  { key: 'yunxi', label: '云希', desc: '年轻活力，适合短视频口播', gender: 'male', style: '通用' },
  { key: 'yunyang', label: '云扬', desc: '专业播音，正式稳重', gender: 'male', style: '新闻' },
  { key: 'yunjian', label: '云健', desc: '沉稳有力，纪录片质感', gender: 'male', style: '纪录片' },
  { key: 'wanlung', label: '雲龍', desc: '粤语男声，正式叙述', gender: 'male', style: '粤语' },
  { key: 'xiaoxiao', label: '晓晓', desc: '温柔自然，适合日常旁白', gender: 'female', style: '通用' },
  { key: 'xiaoyi', label: '晓艺', desc: '甜美可爱，适合轻快内容', gender: 'female', style: '通用' },
  { key: 'xiaoxuan', label: '晓萱', desc: '活泼开朗，综艺感强', gender: 'female', style: '通用' },
  { key: 'hiugaai', label: '曉佳', desc: '粤语女声，本地化内容', gender: 'female', style: '粤语' },
  { key: 'hiumaan', label: '曉敏', desc: '粤语女声，温柔稳重', gender: 'female', style: '粤语' },
];
const EMOTIONS = [
  { key: 'neutral', label: '自然' },
  { key: 'cheerful', label: '欢快' },
  { key: 'gentle', label: '温柔' },
  { key: 'serious', label: '严肃' },
  { key: 'warm', label: '温暖' },
  { key: 'sad', label: '伤感' },
  { key: 'angry', label: '激动' },
  { key: 'dramatic', label: '戏剧' },
];
const ONLINE_TAGS = [
  { label: '开心', query: 'happy' },
  { label: '愉快', query: 'cheerful' },
  { label: '放松', query: 'chill' },
  { label: '氛围', query: 'ambient' },
  { label: '活力', query: 'upbeat' },
  { label: '浪漫', query: 'romance' },
  { label: '史诗', query: 'epic' },
  { label: '安静', query: 'calm' },
];
function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) {
  const styles: Record<string, string> = { default: 'bg-gray-100 text-gray-600', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-red-50 text-red-700', info: 'bg-blue-50 text-blue-700' };
  return <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + styles[variant]}>{children}</span>;
}
function SectionTitle({ icon, title, extra }: { icon: string; title: string; extra?: React.ReactNode }) {
  return (<div className="flex items-center justify-between mb-3"><h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><span className="text-base">{icon}</span>{title}</h2>{extra}</div>);
}
function filterByQuery(items: BgmItem[], query: string) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || (item.artist||'').toLowerCase().includes(q) || (item.tags||[]).some(t => t.toLowerCase().includes(q)));
}
export default function TTSPage() {
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [text, setText] = useState('这是一段测试文案，你可以在这里输入任意内容来试听不同音色的效果。');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [apiKeyTesting, setApiKeyTesting] = useState(false);
  const [apiKeyTestResult, setApiKeyTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{ available: boolean; message: string } | null>(null);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [elKeyInput, setElKeyInput] = useState('');
  const [elKeyConfigured, setElKeyConfigured] = useState(false);
  const [elKeyMasked, setElKeyMasked] = useState('');
  const [elKeyTesting, setElKeyTesting] = useState(false);
  const [elKeyTestResult, setElKeyTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [genError, setGenError] = useState('');
  const [providerUsed, setProviderUsed] = useState('');
  const [elVoices, setElVoices] = useState<ElVoice[]>([]);
  const [elQuota, setElQuota] = useState<{ remaining: number; limit: number; reset: string } | null>(null);
  const [dashQuotaOk, setDashQuotaOk] = useState<boolean | null>(null);
  const [dashQuotaMsg, setDashQuotaMsg] = useState('');
  const [ttsMode, setTtsMode] = useState<'edge' | 'elevenlabs' | 'cosy-clone'>('edge');
  const [selectedVoice, setSelectedVoice] = useState('yunxi')
  const [selectedElVoice, setSelectedElVoice] = useState('');
  const [selectedCloneId, setSelectedCloneId] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [bgmFile, setBgmFile] = useState<File | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.65);
  const [bgmTab, setBgmTab] = useState<'library' | 'online' | 'upload'>('library');
  const [bgmItems, setBgmItems] = useState<BgmItem[]>([]);
  const [bgmLoading, setBgmLoading] = useState(false);
  const [bgmError, setBgmError] = useState('');
  const [bgmQuery, setBgmQuery] = useState('');
  const [onlineQuery, setOnlineQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<BgmItem[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [selectedBgmUrl, setSelectedBgmUrl] = useState('');
  const [selectedBgmName, setSelectedBgmName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [cosyEndpoint, setCosyEndpoint] = useState('');
  const [cosyModel, setCosyModel] = useState('CosyVoice-0.5');
  const [cosyRefText, setCosyRefText] = useState('');
  const [cosyRefUrl, setCosyRefUrl] = useState('');
  const [cosyReady, setCosyReady] = useState(false);
  useEffect(() => {
    fetch('/api/tts/clone').then(r=>r.json()).then(d=>{ if(d?.success&&Array.isArray(d.data)) setClonedVoices(d.data); }).catch(()=>{});
    fetch('/api/tts/el-key').then(r=>r.json()).then(d=>{ if(d?.configured){ setElKeyConfigured(true); setElKeyMasked(d.maskedKey); }}).catch(()=>{});
    fetch('/api/tts/key').then(r=>r.json()).then(d=>{ if(d?.configured){ setApiKeyConfigured(true); setApiKeyMasked(d.maskedKey); }}).catch(()=>{});
    fetch('/api/tts/cosy').then(r=>r.json()).then(d=>{ if(d?.success&&d.data?.endpoint){ setCosyEndpoint(d.data.endpoint); setCosyModel(d.data.model||'CosyVoice-0.5'); setCosyReady(true); }}).catch(()=>{});
    fetchBgmItems('library','');
  }, []);
  async function fetchBgmItems(source: string, query: string) {
    setBgmLoading(true); setBgmError('');
    try {
      const qs = new URLSearchParams({ source, limit: '50' });
      if (query) qs.set('q', query);
      const res = await fetch('/api/bgm?' + qs.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '加载失败');
      const list: BgmItem[] = data?.data || [];
      setBgmItems(source === 'library' && !query ? list.filter(x => x.source === 'library' || x.source === 'builtin') : list);
    } catch (e: any) { setBgmError(e?.message || '加载失败'); setBgmItems([]); } finally { setBgmLoading(false); }
  }
  function preview(item: BgmItem) {
    if (previewUrl === item.url) { stopPreview(); return; }
    stopPreview(); setPreviewUrl(item.url);
    requestAnimationFrame(() => { const el = previewRef.current; if (el) { el.volume = Math.min(1, Math.max(bgmVolume, 0.6)); el.play().catch(()=>{}); } });
  }
  function stopPreview() { const el = previewRef.current; if (el) { el.pause(); el.currentTime = 0; } setPreviewUrl(''); }
  function selectBgm(item: BgmItem) { setSelectedBgmUrl(item.url); setSelectedBgmName(item.name); preview(item); }
  async function downloadAndUse(item: BgmItem) {
    try {
      setBgmError(''); setBgmLoading(true);
      const res = await fetch('/api/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: item.url, name: item.name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '下载失败');
      const localUrl = data?.data?.url;
      if (!localUrl) throw new Error('下载结果异常');
      setSelectedBgmUrl(localUrl); setSelectedBgmName(item.name); await fetchBgmItems('library',''); stopPreview();
      setPreviewUrl(localUrl);
      requestAnimationFrame(() => { const el = previewRef.current; if (el) { el.volume = Math.min(1, bgmVolume + 0.2); el.play().catch(()=>{}); } });
    } catch (e: any) { setBgmError(e?.message || '使用失败'); } finally { setBgmLoading(false); }
  }

  async function searchOnline(q: string) {
    if (!q.trim()) return;
    setOnlineLoading(true); setOnlineError(''); setOnlineResults([]);
    try {
      const res = await fetch('/api/bgm?source=ccmixter&q=' + encodeURIComponent(q.trim()) + '&limit=20');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '搜索失败');
      setOnlineResults((data?.data || []).filter((x: BgmItem) => x.source === 'ccmixter'));
    } catch (e: any) { setOnlineError(e?.message || '搜索失败'); } finally { setOnlineLoading(false); }
  }
  async function importToLibrary(item: BgmItem) {
    setDownloadingId(item.id); setOnlineError('');
    try {
      const res = await fetch('/api/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: item.url, name: item.name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '导入失败');
      setDownloadedIds(prev => new Set([...prev, item.id]));
      if (data?.data?.url) { setSelectedBgmUrl(data.data.url); setSelectedBgmName(item.name); }
      await fetchBgmItems('library','');
    } catch (e: any) { setOnlineError(e?.message || '导入失败'); } finally { setDownloadingId(null); }
  }
  function stopOnlinePreview() { if (previewRef.current) { previewRef.current.pause(); previewRef.current.src = ''; } setPreviewUrl(''); }
  function previewOnline(item: BgmItem) {
    stopPreview(); stopOnlinePreview();
    setPreviewUrl(item.url);
    requestAnimationFrame(() => { const el = previewRef.current; if (el) { el.volume = Math.min(1, Math.max(bgmVolume, 0.6)); el.src = item.url; el.play().catch(()=>{}); } });
  }

    async function handleUploadBgm(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setBgmError(''); setBgmLoading(true);
      const form = new FormData(); form.append('file', file); form.append('name', file.name.replace(/.[^.]+$/, ''));
      const res = await fetch('/api/bgm/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '上传失败');
      setSelectedBgmUrl(data?.data?.url); setSelectedBgmName(file.name); await fetchBgmItems('library','');
    } catch (e: any) { setBgmError(e?.message || '上传失败'); } finally { setBgmLoading(false); e.target.value = ''; }
  }
  async function handleSaveApiKey() {
    setApiKeyTesting(true); setApiKeyTestResult(null);
    try {
      const res = await fetch('/api/tts/key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: apiKeyInput }) });
      const d = await res.json();
      if (res.ok && d?.success) { setApiKeyConfigured(true); setApiKeyMasked(d.maskedKey); setApiKeyTestResult({ ok: true, msg: 'Key saved' }); setApiKeyInput(''); }
      else { setApiKeyTestResult({ ok: false, msg: d?.error || 'save failed' }); }
    } catch { setApiKeyTestResult({ ok: false, msg: 'network error' }); } finally { setApiKeyTesting(false); }
  }
  async function handleSaveElKey() {
    setElKeyTesting(true); setElKeyTestResult(null);
    try {
      const res = await fetch('/api/tts/el-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: elKeyInput }) });
      const d = await res.json();
      if (res.ok && d?.success) { setElKeyConfigured(true); setElKeyMasked(d.maskedKey); setElKeyTestResult({ ok: true, msg: 'ElevenLabs key saved' }); setElKeyInput(''); }
      else { setElKeyTestResult({ ok: false, msg: d?.error || 'save failed' }); }
    } catch { setElKeyTestResult({ ok: false, msg: 'network error' }); } finally { setElKeyTesting(false); }
  }
  async function checkQuota() { setCheckingQuota(true); try { const res = await fetch('/api/tts/quota'); const d = await res.json(); setQuotaInfo(d); } catch { setQuotaInfo({ available: false, message: 'check failed' }); } finally { setCheckingQuota(false); } }
  async function checkElQuota() { try { const res = await fetch('/api/tts/el-quota'); const d = await res.json(); if (d?.success) setElQuota(d.data); } catch {} }
  async function checkDashQuota() { try { const res = await fetch('/api/tts/dashscope/quota'); const d = await res.json(); setDashQuotaOk(d?.ok ?? null); setDashQuotaMsg(d?.message || ''); } catch {} }
  async function listElVoices() { try { const res = await fetch('/api/tts/el-voices'); const d = await res.json(); if (d?.success && Array.isArray(d.data)) setElVoices(d.data); } catch {} }
  useEffect(() => { if (ttsMode === 'elevenlabs' && elVoices.length === 0) listElVoices(); }, [ttsMode]);
  async function handleClone() {
    if (!sampleFile) return;
    setCloning(true); setCloneError('');
    try {
      const form = new FormData(); form.append('file', sampleFile);
      const res = await fetch('/api/tts/clone', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'clone failed');
      setClonedVoices(prev => [data.data, ...prev]); setSampleFile(null);
    } catch (e: any) { setCloneError(e?.message || 'clone failed'); } finally { setCloning(false); }
  }
  async function handleDeleteClone(id: string) { try { await fetch('/api/tts/clone?id=' + id, { method: 'DELETE' }); setClonedVoices(prev => prev.filter(v => v.id !== id)); if (selectedCloneId === id) setSelectedCloneId(''); } catch {} }
  async function handleRenameClone(id: string) { try { await fetch('/api/tts/clone', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: editingName }) }); setClonedVoices(prev => prev.map(v => v.id === id ? { ...v, name: editingName } : v)); setEditingId(null); } catch {} }
  async function handleSynthesize() {
    if (!text.trim()) return;
    setGenerating(true); setGenError(''); setAudioUrl(''); setProviderUsed('');
    try {
      const body: any = { text: text.trim(), bgmUrl: selectedBgmUrl || undefined, bgmVolume };
      if (ttsMode === 'edge') { body.source = 'edge'; body.voice = selectedVoice; body.emotion = (["yunxi","yunyang","yunjian","wanlung"].includes(selectedVoice) && !["neutral","serious","warm"].includes(emotion)) ? 'neutral' : emotion; }
      else if (ttsMode === 'elevenlabs') { body.source = 'elevenlabs'; body.voiceId = selectedElVoice; }
      else { body.source = 'cosy-clone'; body.cloneId = selectedCloneId; }
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok || !d?.success) throw new Error(d?.error || 'generate failed');
      setAudioUrl(d.data.audioUrl); setProviderUsed(d.data.provider || ttsMode);
    } catch (e: any) { setGenError(e?.message || 'generate failed'); } finally { setGenerating(false); }
  }
  const filteredLibrary = filterByQuery(bgmItems.filter(x => x.source === 'library' || x.source === 'builtin'), bgmQuery);
  const filteredOnline = filterByQuery(bgmItems.filter(x => x.source === 'ccmixter'), bgmQuery);
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">声音工作台</h1>
            <p className="text-xs text-gray-400 mt-1">选音色、写文案、加 BGM，一页搞定。</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">BGM 音量 {Math.round(bgmVolume * 100)}%</Badge>
            {selectedBgmName && <Badge variant="success">当前 BGM：{selectedBgmName}</Badge>}
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"📝"} title={"合成文案"} extra={<div className="flex gap-2">{['edge','elevenlabs','cosy-clone'].map(m=>(<button key={m} onClick={()=>setTtsMode(m as any)} className={'px-3 py-1.5 rounded-full text-xs font-medium transition-all '+(ttsMode===m?'bg-violet-600 text-white shadow-sm':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{m==='edge'?'Edge TTS':m==='elevenlabs'?'ElevenLabs':'CosyVoice 克隆'}</button>))}</div>} />
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} className="w-full rounded-xl border border-gray-200 p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-300" placeholder={"输入你想合成的文案..."} />
            </section>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"🎛️"} title={"参数调节"} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {ttsMode==='edge' && (<>
                  <div><div className="text-xs text-gray-500 mb-1">Edge 音色</div><div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-1">{EDGE_FALLBACK.map(v=>(<button key={v.key} onClick={()=>{ setSelectedVoice(v.key); if (['yunxi','yunyang','yunjian','wanlung'].includes(v.key) && !['neutral','serious','warm'].includes(emotion)) { setEmotion('neutral'); } }} className={'text-left rounded-xl px-2.5 py-2 transition-all '+(selectedVoice===v.key?'bg-violet-100 border border-violet-300':'bg-gray-50 border border-transparent hover:bg-gray-100')}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-800">{v.label}</span><span className={'text-[10px] rounded-full px-1.5 py-0.5 '+(v.gender==='male'?'bg-blue-50 text-blue-600':'bg-pink-50 text-pink-600')}>{v.gender==='male'?'男':'女'}</span></div><div className="text-[10px] text-gray-400">{v.desc}</div></button>))}</div></div>
                  <div><div className="text-xs text-gray-500 mb-1">情绪</div><div className="grid grid-cols-4 gap-1.5">{EMOTIONS.map(e=>(<button key={e.key} onClick={()=>setEmotion(e.key)} className={'flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition-all '+(emotion===e.key?'bg-violet-100 border border-violet-300':'bg-gray-50 border border-transparent hover:bg-gray-100')}><span>{e.icon}</span><span className="text-gray-700">{e.label}</span></button>))}</div><div className="mt-3 text-xs text-gray-400">选男生音色 + 自然情绪即可避免被随机切换成女声。</div></div>
                </>)}
                {ttsMode==='elevenlabs' && <div className="md:col-span-2"><div className="text-xs text-gray-500 mb-1">ElevenLabs 音色</div><select value={selectedElVoice} onChange={e=>setSelectedElVoice(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"><option value="">请选择音色</option>{elVoices.map(v=><option key={v.key} value={v.key}>{v.label} - {v.desc}</option>)}</select></div>}
                {ttsMode==='cosy-clone' && <div className="md:col-span-2 text-sm text-gray-500">当前使用 CosyVoice 克隆音色，请在右侧“声音克隆”页签管理样本。{cosyReady?<span className="ml-2 text-emerald-600">已配置</span>:<span className="ml-2 text-amber-600">未配置</span>}</div>}
              </div>
            </section>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"🎵"} title={"BGM"} extra={<button className="text-xs text-violet-600 hover:text-violet-700" onClick={()=>fetchBgmItems(bgmTab==='online'?'ccmixter':'library', bgmTab==='online'?bgmQuery:'')}>{'刷新'}</button>} />
              <div className="flex items-center gap-3 mb-3"><div className="flex-1"><div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>{'BGM 音量'}</span><span>{Math.round(bgmVolume*100)}%</span></div><input type="range" min={0} max={1} step={0.01} value={bgmVolume} onChange={e=>setBgmVolume(parseFloat(e.target.value))} className="w-full" /></div>{selectedBgmUrl&&<button onClick={()=>{setSelectedBgmUrl('');setSelectedBgmName('');stopPreview();}} className="text-xs text-gray-400 hover:text-red-500 transition">{'清空已选'}</button>}</div>
              <div className="flex gap-2 mb-3">{([['library','🎵 音乐库'],['online','🌐 在线搜索'],['upload','⬆️ 上传']] as const).map(([key,label])=>(<button key={key} onClick={()=>{setBgmTab(key);if(key==='library')fetchBgmItems('library','');}} className={'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all '+(bgmTab===key?'bg-white text-violet-700 shadow-sm':'text-gray-400 hover:text-gray-600')}>{label}</button>))}</div>
              {bgmTab==='library' && <div className="space-y-2"><input value={bgmQuery} onChange={e=>setBgmQuery(e.target.value)} placeholder={"在已保存的音乐库中搜索..."} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" /><div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto">{filteredLibrary.map(item=>(<div key={item.id} className={'rounded-xl transition-all text-xs '+(selectedBgmUrl===item.url?'bg-violet-100 border border-violet-300':'bg-gray-50 border border-transparent')}><button onClick={()=>selectBgm(item)} className="w-full text-left px-3 py-2"><div className="font-semibold text-gray-800 truncate">{item.name}</div><div className="text-[10px] text-gray-400 truncate">{item.category}{item.artist?' · '+item.artist:''}</div></button><div className="px-3 pb-2 flex items-center gap-2"><button onClick={()=>preview(item)} className="text-[10px] text-violet-600">{previewUrl===item.url?'⏹ 停止':'▶ 试听'}</button><button onClick={()=>selectBgm(item)} className="text-[10px] text-emerald-600">{'选用'}</button></div></div>))}{filteredLibrary.length===0&&<div className="col-span-2 text-center text-xs text-gray-300 py-6">{'暂无本地音乐，请先上传或从在线曲库导入。'}</div>}</div></div>}
              {bgmTab==='online' && <div className="space-y-3">
  <div className="flex gap-2">
    <input value={onlineQuery} onChange={e=>setOnlineQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')searchOnline(onlineQuery);}} placeholder={"搜索 happy、chill、ambient等..."} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" />
    <button onClick={()=>searchOnline(onlineQuery)} disabled={onlineLoading} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium transition">{onlineLoading?'搜索中...':'搜索'}</button>
  </div>
  <div className="flex flex-wrap gap-1.5">
    {['happy','chill','ambient','upbeat','sad','epic','jazz','lo-fi'].map(tag=>(
      <button key={tag} onClick={()=>{setOnlineQuery(tag);searchOnline(tag);}} className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-all">{tag}</button>
    ))}
  </div>
  {onlineError && <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{onlineError}</div>}
  {onlineLoading && <div className="text-center text-xs text-gray-400 py-4">{"正在搜索..."}</div>}
  {!onlineLoading && onlineResults.length > 0 && <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
    {onlineResults.map(item=>(
      <div key={item.id} className="rounded-xl bg-gray-50 border border-transparent hover:border-violet-200 transition-all">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-xs truncate">{item.name}</div>
            <div className="text-[10px] text-gray-400 truncate">{item.artist||'ccMixter'}{item.tags?.length ? ' · '+item.tags.slice(0,3).join(', ') : ''}</div>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <button onClick={()=>previewUrl===item.url ? (stopPreview(),stopOnlinePreview()) : previewOnline(item)} className="text-[10px] px-2 py-1 rounded-lg text-violet-600 hover:bg-violet-50 transition">{previewUrl===item.url?'⏹ 停止':'▶ 试听'}</button>
            {downloadedIds.has(item.id) ? <span className="text-[10px] px-2 py-1 text-emerald-600">✓ 已入库</span> :
              <button onClick={()=>importToLibrary(item)} disabled={downloadingId===item.id} className="text-[10px] px-2 py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50">{downloadingId===item.id?'导入中...':'⬇ 入库'}</button>}
          </div>
        </div>
      </div>
    ))}
  </div>}
  {!onlineLoading && onlineResults.length === 0 && onlineQuery && !onlineError && <div className="text-center text-xs text-gray-300 py-6">{"无结果，试试其他关键词"}</div>}
  {!onlineLoading && !onlineQuery && <div className="text-[11px] text-gray-400 text-center py-2">{"输入关键词搜索，点击试听即可播放，点击入库保存到本地音乐库"}</div>}
</div>}
              {bgmTab==='upload' && <div className="space-y-3">
  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-sm text-gray-400">
    <span>{'拖拽或点击上传 MP3/WAV/OGG'}</span>
    <input type="file" accept=".mp3,.wav,.ogg" className="hidden" onChange={handleUploadBgm} />
  </label>
  <div className="text-xs text-gray-500 font-medium">{'或者粘贴音乐 URL：'}</div>
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
              if (!res.ok) throw new Error(data?.error || '下载失败');
              setSelectedBgmUrl(data?.data?.url);
              setSelectedBgmName('URL BGM');
              await fetchBgmItems('library', '');
              (e.target as HTMLInputElement).value = '';
            } catch (e: any) {
              setBgmError(e?.message || '下载失败');
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
            if (!res.ok) throw new Error(data?.error || '下载失败');
            setSelectedBgmUrl(data?.data?.url);
            setSelectedBgmName('URL BGM');
            await fetchBgmItems('library', '');
            input.value = '';
          } catch (e: any) {
            setBgmError(e?.message || '下载失败');
          } finally {
            setBgmLoading(false);
          }
        }
      }}
      className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs"
    >
      {'下载'}
    </button>
  </div>
  <div className="text-[11px] text-gray-400">{'上传或下载后会自动保存到本地音乐库，后续可直接在“音乐库”页签反复使用。'}</div>
</div>}
              <audio ref={previewRef} src={previewUrl} preload="auto" onEnded={()=>setPreviewUrl('')} className="mt-2 w-full" controls />
            </section>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"🚀"} title={"生成"} extra={<div className="flex items-center gap-2 text-xs text-gray-400">{providerUsed&&<Badge variant="info">{'上次来源：'}{providerUsed}</Badge>}</div>} />
              <div className="flex items-center gap-3"><button onClick={handleSynthesize} disabled={generating||!text.trim()} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition">{generating?'正在生成...':'生成语音'}</button>{audioUrl&&<a href={audioUrl} download className="px-3 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition">{'下载音频'}</a>}</div>
              {genError&&<div className="mt-2 text-xs text-red-500">{genError}</div>}
              {audioUrl&&<audio controls src={audioUrl} className="mt-3 w-full" />}
            </section>
          </div>
          <div className="space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex gap-2 mb-3">{([['voice','音色库'],['clone','声音克隆'],['settings','设置']] as const).map(([key,label])=>(<button key={key} className={'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-white text-violet-700 shadow-sm'}>{label}</button>))}</div>
              <div className="space-y-4 text-sm"><div><div className="text-xs text-gray-500 mb-2">{'当前音色'}</div>{ttsMode==='edge'&&<div className="text-gray-800 font-medium">{EDGE_FALLBACK.find(v=>v.key===selectedVoice)?.label||selectedVoice}</div>}{ttsMode==='elevenlabs'&&<div className="text-gray-800 font-medium">{selectedElVoice||'未选择'}</div>}{ttsMode==='cosy-clone'&&<div className="text-gray-800 font-medium">{selectedCloneId||'未选择克隆音色'}</div>}</div><div className="border-t border-gray-100" /><div><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">{'上传声音样本'}</h3></div><div className="space-y-2"><label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-xs text-gray-400"><span>{sampleFile?sampleFile.name:'上传 10~30 秒清晰人声 WAV/MP3'}</span><input type="file" accept=".wav,.mp3" className="hidden" onChange={e=>setSampleFile(e.target.files?.[0]||null)} /></label><button onClick={handleClone} disabled={!sampleFile||cloning} className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-medium transition">{cloning?'克隆中...':'开始克隆'}</button>{cloneError&&<div className="text-xs text-red-500">{cloneError}</div>}</div></div><div className="border-t border-gray-100" /><div><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">DashScope Key</h3><Badge variant={apiKeyConfigured?'success':'default'}>{apiKeyConfigured?'已配置':'未配置'}</Badge></div>{apiKeyConfigured&&<p className="text-xs text-gray-400 mb-2 font-mono">{apiKeyMasked}</p>}{showApiKey?<div className="space-y-2"><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" type="password" placeholder="sk-..." value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} /><div className="flex gap-2"><button className="flex-1 py-2 rounded-xl text-white text-xs font-medium bg-violet-500 hover:bg-violet-600 transition" onClick={handleSaveApiKey} disabled={apiKeyTesting}>{apiKeyTesting?'...':'保存并测试'}</button><button className="py-2 px-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition" onClick={()=>setShowApiKey(false)}>{'取消'}</button></div>{apiKeyTestResult&&<p className={'text-xs '+(apiKeyTestResult.ok?'text-emerald-600':'text-red-600')}>{apiKeyTestResult.msg}</p>}</div>:<button className="text-xs text-violet-600 hover:text-violet-700 font-medium" onClick={()=>setShowApiKey(true)}>{apiKeyConfigured?'更换 Key':'配置 Key'}</button>}</div><div className="border-t border-gray-100" /><div><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">ElevenLabs Key</h3><Badge variant={elKeyConfigured?'success':'default'}>{elKeyConfigured?'已配置':'未配置'}</Badge></div>{elKeyConfigured&&<p className="text-xs text-gray-400 mb-2 font-mono">{elKeyMasked}</p>}{showUsage?<div className="space-y-2"><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" type="password" placeholder="EL Key..." value={elKeyInput} onChange={e=>setElKeyInput(e.target.value)} /><div className="flex gap-2"><button className="flex-1 py-2 rounded-xl text-white text-xs font-medium bg-violet-500 hover:bg-violet-600 transition" onClick={handleSaveElKey} disabled={elKeyTesting}>{elKeyTesting?'...':'保存并测试'}</button><button className="py-2 px-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition" onClick={()=>setShowUsage(false)}>{'取消'}</button></div>{elKeyTestResult&&<p className={'text-xs '+(elKeyTestResult.ok?'text-emerald-600':'text-red-600')}>{elKeyTestResult.msg}</p>}</div>:<button className="text-xs text-violet-600 hover:text-violet-700 font-medium" onClick={()=>setShowUsage(true)}>{elKeyConfigured?'更换 Key':'配置 Key'}</button>}</div><div className="border-t border-gray-100" /><div><h3 className="text-sm font-bold text-gray-800 mb-2">{'配额与连通性'}</h3><button className="text-xs text-violet-600 hover:text-violet-700 font-medium" onClick={()=>{checkQuota();checkElQuota();checkDashQuota();}}>{checkingQuota?'检查中...':'一键检查'}</button>{quotaInfo&&<p className="text-xs text-gray-500 mt-2">{quotaInfo.message||(quotaInfo.available?'当前状态正常':'当前不可用')}</p>}{elQuota&&<p className="text-xs text-gray-500 mt-1">ElevenLabs remaining: {elQuota.remaining} / {elQuota.limit}</p>}</div></div>
            </section>
          </div>
        </div>
        <footer className="text-center text-xs text-gray-300 pt-8 pb-2">{'声音工作台 · 支持 Edge TTS / ElevenLabs / CosyVoice'}</footer>
      </div>
    </div>
  );
}
