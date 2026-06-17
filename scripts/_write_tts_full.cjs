const fs = require('fs');
const path = 'app/tts/page.tsx';
const content = `'use client';
import { useState, useEffect, useRef } from 'react';
interface ClonedVoice { id: string; name: string; voiceId: string; source: string; createdAt: string; }
interface ElVoice { key: string; label: string; desc: string; }
interface EdgeVoice { key: string; label: string; desc: string; gender: string; style: string; }
interface BgmItem { id: string; name: string; category: string; source: string; url: string; artist?: string; tags?: string[]; }
const EDGE_FALLBACK: EdgeVoice[] = [
  { key: 'xiaoxiao', label: '\u6653\u6653', desc: '\u6e29\u67d4\u81ea\u7136', gender: 'female', style: '\u901a\u7528' },
  { key: 'yunxi', label: '\u4e91\u5e0c', desc: '\u5e74\u8f7b\u6d3b\u529b', gender: 'male', style: '\u901a\u7528' },
  { key: 'yunyang', label: '\u4e91\u626c', desc: '\u4e13\u4e1a\u64ad\u97f3', gender: 'male', style: '\u65b0\u95fb' },
  { key: 'xiaoyi', label: '\u6653\u4f9d', desc: '\u751c\u7f8e\u53ef\u7231', gender: 'female', style: '\u901a\u7528' },
  { key: 'xiaoxuan', label: '\u6653\u8431', desc: '\u6d3b\u6cfc\u5f00\u6717', gender: 'female', style: '\u901a\u7528' },
  { key: 'yunjian', label: '\u4e91\u5065', desc: '\u6c89\u7a33\u6709\u529b', gender: 'male', style: '\u7eaa\u5f55\u7247' },
  { key: 'hiugaai', label: '\u66c9\u4f73', desc: '\u7ca4\u8bed\u5973\u58f0', gender: 'female', style: '\u7ca4\u8bed' },
  { key: 'hiumaan', label: '\u66c9\u654f', desc: '\u7ca4\u8bed\u5973\u58f0', gender: 'female', style: '\u7ca4\u8bed' },
  { key: 'wanlung', label: '\u96f2\u9f8d', desc: '\u7ca4\u8bed\u7537\u58f0', gender: 'male', style: '\u7ca4\u8bed' },
];
const EMOTIONS = [
  { key: 'neutral', label: '\u81ea\u7136', icon: '\u{1F642}' },
  { key: 'cheerful', label: '\u6b22\u5feb', icon: '\u{1F604}' },
  { key: 'gentle', label: '\u6e29\u67d4', icon: '\u{1F970}' },
  { key: 'serious', label: '\u4e25\u8083', icon: '\u{1F610}' },
  { key: 'warm', label: '\u6e29\u6696', icon: '\u2600\uFE0F' },
  { key: 'sad', label: '\u4f24\u611f', icon: '\u{1F622}' },
  { key: 'angry', label: '\u6fc0\u52a8', icon: '\u{1F525}' },
  { key: 'dramatic', label: '\u620f\u5267', icon: '\u{1F3AD}' },
];
const ONLINE_TAGS = ['happy','chill','ambient','upbeat','sad','epic','jazz','lo-fi'];
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
  const [text, setText] = useState('\u8fd9\u662f\u4e00\u6bb5\u6d4b\u8bd5\u6587\u6848\uff0c\u4f60\u53ef\u4ee5\u5728\u8fd9\u91cc\u8f93\u5165\u4efb\u610f\u5185\u5bb9\u6765\u8bd5\u542c\u4e0d\u540c\u97f3\u8272\u7684\u6548\u679c\u3002');
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
  const [selectedVoice, setSelectedVoice] = useState('xiaoxiao');
  const [selectedElVoice, setSelectedElVoice] = useState('');
  const [selectedCloneId, setSelectedCloneId] = useState('');
  const [emotion, setEmotion] = useState('neutral');
  const [bgmFile, setBgmFile] = useState<File | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.85);
  const [bgmTab, setBgmTab] = useState<'library' | 'online' | 'upload'>('library');
  const [bgmItems, setBgmItems] = useState<BgmItem[]>([]);
  const [bgmLoading, setBgmLoading] = useState(false);
  const [bgmError, setBgmError] = useState('');
  const [bgmQuery, setBgmQuery] = useState('');
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
      if (!res.ok) throw new Error(data?.error || '\u52a0\u8f7d\u5931\u8d25');
      const list: BgmItem[] = data?.data || [];
      setBgmItems(source === 'library' && !query ? list.filter(x => x.source === 'library' || x.source === 'builtin') : list);
    } catch (e: any) { setBgmError(e?.message || '\u52a0\u8f7d\u5931\u8d25'); setBgmItems([]); } finally { setBgmLoading(false); }
  }
  function preview(item: BgmItem) {
    if (previewUrl === item.url) { stopPreview(); return; }
    stopPreview(); setPreviewUrl(item.url);
    requestAnimationFrame(() => { const el = previewRef.current; if (el) { el.volume = Math.min(1, bgmVolume + 0.2); el.play().catch(()=>{}); } });
  }
  function stopPreview() { const el = previewRef.current; if (el) { el.pause(); el.currentTime = 0; } setPreviewUrl(''); }
  function selectBgm(item: BgmItem) { setSelectedBgmUrl(item.url); setSelectedBgmName(item.name); preview(item); }
  async function downloadAndUse(item: BgmItem) {
    try {
      setBgmError(''); setBgmLoading(true);
      const res = await fetch('/api/bgm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: item.url, name: item.name }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '\u4e0b\u8f7d\u5931\u8d25');
      const localUrl = data?.data?.url;
      if (!localUrl) throw new Error('\u4e0b\u8f7d\u7ed3\u679c\u5f02\u5e38');
      setSelectedBgmUrl(localUrl); setSelectedBgmName(item.name); await fetchBgmItems('library',''); stopPreview();
      setPreviewUrl(localUrl);
      requestAnimationFrame(() => { const el = previewRef.current; if (el) { el.volume = Math.min(1, bgmVolume + 0.2); el.play().catch(()=>{}); } });
    } catch (e: any) { setBgmError(e?.message || '\u4f7f\u7528\u5931\u8d25'); } finally { setBgmLoading(false); }
  }
  async function handleUploadBgm(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setBgmError(''); setBgmLoading(true);
      const form = new FormData(); form.append('file', file); form.append('name', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('/api/bgm/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '\u4e0a\u4f20\u5931\u8d25');
      setSelectedBgmUrl(data?.data?.url); setSelectedBgmName(file.name); await fetchBgmItems('library','');
    } catch (e: any) { setBgmError(e?.message || '\u4e0a\u4f20\u5931\u8d25'); } finally { setBgmLoading(false); e.target.value = ''; }
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
      if (ttsMode === 'edge') { body.source = 'edge'; body.voice = selectedVoice; body.emotion = emotion; }
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
            <h1 className="text-2xl font-bold text-gray-900">\u58f0\u97f3\u5de5\u4f5c\u53f0</h1>
            <p className="text-xs text-gray-400 mt-1">Edge TTS \u00b7 ElevenLabs \u00b7 CosyVoice \u514b\u9686</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">BGM \u97f3\u91cf {Math.round(bgmVolume * 100)}%</Badge>
            {selectedBgmName && <Badge variant="success">\u5f53\u524d BGM\uff1a{selectedBgmName}</Badge>}
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"\u{1F4DD}"} title={"\u5408\u6210\u6587\u6848"} extra={<div className="flex gap-2">{['edge','elevenlabs','cosy-clone'].map(m=>(<button key={m} onClick={()=>setTtsMode(m as any)} className={'px-3 py-1.5 rounded-full text-xs font-medium transition-all '+(ttsMode===m?'bg-violet-600 text-white shadow-sm':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{m==='edge'?'Edge TTS':m==='elevenlabs'?'ElevenLabs':'CosyVoice \u514b\u9686'}</button>))}</div>} />
              <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} className="w-full rounded-xl border border-gray-200 p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-300" placeholder={"\u8f93\u5165\u4f60\u60f3\u5408\u6210\u7684\u6587\u6848..."} />
            </section>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"\u{1F39B}\uFE0F"} title={"\u53c2\u6570\u8c03\u8282"} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {ttsMode==='edge' && (<>
                  <div><div className="text-xs text-gray-500 mb-1">Edge \u97f3\u8272</div><div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto pr-1">{EDGE_FALLBACK.map(v=>(<button key={v.key} onClick={()=>setSelectedVoice(v.key)} className={'text-left rounded-xl px-2.5 py-2 transition-all '+(selectedVoice===v.key?'bg-violet-100 border border-violet-300':'bg-gray-50 border border-transparent hover:bg-gray-100')}><div className="text-xs font-semibold text-gray-800">{v.label}</div><div className="text-[10px] text-gray-400">{v.desc}</div></button>))}</div></div>
                  <div><div className="text-xs text-gray-500 mb-1">\u60c5\u7eea</div><div className="grid grid-cols-4 gap-1.5">{EMOTIONS.map(e=>(<button key={e.key} onClick={()=>setEmotion(e.key)} className={'flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs transition-all '+(emotion===e.key?'bg-violet-100 border border-violet-300':'bg-gray-50 border border-transparent hover:bg-gray-100')}><span>{e.icon}</span><span className="text-gray-700">{e.label}</span></button>))}</div><div className="mt-3 text-xs text-gray-400">\u9009\u7537\u751f\u97f3\u8272 + \u81ea\u7136\u60c5\u7eea\u5373\u53ef\u907f\u514d\u88ab\u968f\u673a\u5207\u6362\u6210\u5973\u58f0\u3002</div></div>
                </>)}
                {ttsMode==='elevenlabs' && <div className="md:col-span-2"><div className="text-xs text-gray-500 mb-1">ElevenLabs \u97f3\u8272</div><select value={selectedElVoice} onChange={e=>setSelectedElVoice(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"><option value="">\u8bf7\u9009\u62e9\u97f3\u8272</option>{elVoices.map(v=><option key={v.key} value={v.key}>{v.label} - {v.desc}</option>)}</select></div>}
                {ttsMode==='cosy-clone' && <div className="md:col-span-2 text-sm text-gray-500">\u5f53\u524d\u4f7f\u7528 CosyVoice \u514b\u9686\u97f3\u8272\uff0c\u8bf7\u5728\u53f3\u4fa7\u201c\u58f0\u97f3\u514b\u9686\u201d\u9875\u7b7e\u7ba1\u7406\u6837\u672c\u3002{cosyReady?<span className="ml-2 text-emerald-600">\u5df2\u914d\u7f6e</span>:<span className="ml-2 text-amber-600">\u672a\u914d\u7f6e</span>}</div>}
              </div>
            </section>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"\u{1F3B5}"} title={"BGM"} extra={<button className="text-xs text-violet-600 hover:text-violet-700" onClick={()=>fetchBgmItems(bgmTab==='online'?'ccmixter':'library', bgmTab==='online'?bgmQuery:'')}>{'\u5237\u65b0'}</button>} />
              <div className="flex items-center gap-3 mb-3"><div className="flex-1"><div className="flex items-center justify-between text-xs text-gray-500 mb-1"><span>{'BGM \u97f3\u91cf'}</span><span>{Math.round(bgmVolume*100)}%</span></div><input type="range" min={0} max={1} step={0.01} value={bgmVolume} onChange={e=>setBgmVolume(parseFloat(e.target.value))} className="w-full" /></div>{selectedBgmUrl&&<button onClick={()=>{setSelectedBgmUrl('');setSelectedBgmName('');stopPreview();}} className="text-xs text-gray-400 hover:text-red-500 transition">{'\u6e05\u7a7a\u5df2\u9009'}</button>}</div>
              <div className="flex gap-2 mb-3">{([['library','\u{1F3B5} \u97f3\u4e50\u5e93'],['online','\u{1F310} \u5728\u7ebf\u641c\u7d22'],['upload','\u2B06\uFE0F \u4e0a\u4f20']] as const).map(([key,label])=>(<button key={key} onClick={()=>{setBgmTab(key);if(key==='library')fetchBgmItems('library','');}} className={'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all '+(bgmTab===key?'bg-white text-violet-700 shadow-sm':'text-gray-400 hover:text-gray-600')}>{label}</button>))}</div>
              {bgmTab==='library' && <div className="space-y-2"><input value={bgmQuery} onChange={e=>setBgmQuery(e.target.value)} placeholder={"\u5728\u5df2\u4fdd\u5b58\u7684\u97f3\u4e50\u5e93\u4e2d\u641c\u7d22..."} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" /><div className="grid grid-cols-2 gap-1.5 max-h-[260px] overflow-y-auto">{filteredLibrary.map(item=>(<div key={item.id} className={'rounded-xl transition-all text-xs '+(selectedBgmUrl===item.url?'bg-violet-100 border border-violet-300':'bg-gray-50 border border-transparent')}><button onClick={()=>selectBgm(item)} className="w-full text-left px-3 py-2"><div className="font-semibold text-gray-800 truncate">{item.name}</div><div className="text-[10px] text-gray-400 truncate">{item.category}{item.artist?' \u00b7 '+item.artist:''}</div></button><div className="px-3 pb-2 flex items-center gap-2"><button onClick={()=>preview(item)} className="text-[10px] text-violet-600">{previewUrl===item.url?'\u23F9 \u505c\u6b62':'\u25B6 \u8bd5\u542c'}</button><button onClick={()=>selectBgm(item)} className="text-[10px] text-emerald-600">{'\u9009\u7528'}</button></div></div>))}{filteredLibrary.length===0&&<div className="col-span-2 text-center text-xs text-gray-300 py-6">{'\u6682\u65e0\u672c\u5730\u97f3\u4e50\uff0c\u8bf7\u5148\u4e0a\u4f20\u6216\u4ece\u5728\u7ebf\u66f2\u5e93\u5bfc\u5165\u3002'}</div>}</div></div>}
              {bgmTab==='online' && <div className="space-y-2"><div className="flex flex-wrap gap-1.5 mb-1">{ONLINE_TAGS.map(tag=>(<button key={tag} onClick={()=>{setBgmQuery(tag);fetchBgmItems('ccmixter',tag);}} className={'text-[10px] px-2 py-1 rounded-full border transition-all '+(bgmQuery===tag?'border-violet-400 bg-violet-50 text-violet-700':'border-gray-200 text-gray-500 hover:border-violet-300')}>{tag}</button>))}</div><div className="flex gap-2"><input value={bgmQuery} onChange={e=>setBgmQuery(e.target.value)} placeholder={"\u8f93\u5165\u5173\u952e\u8bcd\u641c\u7d22 ccMixter (CC \u534f\u8bae) \u514d\u8d39\u66f2\u5e93"} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" /><button onClick={()=>fetchBgmItems('ccmixter',bgmQuery)} className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs">{'\u641c\u7d22'}</button></div>{bgmError&&<div className="text-xs text-red-500">{bgmError}</div>}<div className="grid grid-cols-1 gap-1.5 max-h-[260px] overflow-y-auto">{filteredOnline.map(item=>(<div key={item.id} className="rounded-xl bg-gray-50 border border-transparent px-3 py-2 text-xs"><div className="flex items-center justify-between"><div className="min-w-0"><div className="font-semibold text-gray-800 truncate">{item.name}</div><div className="text-[10px] text-gray-400 truncate">{item.artist||'\u672a\u77e5\u4f5c\u8005'} \u00b7 {(item.tags||[]).slice(0,3).join(' / ')||'ccMixter'}</div></div><div className="flex items-center gap-2 shrink-0"><button onClick={()=>preview(item)} className="text-[10px] text-violet-600">{previewUrl===item.url?'\u23F9 \u505c\u6b62':'\u25B6 \u8bd5\u542c'}</button><button onClick={()=>downloadAndUse(item)} className="text-[10px] text-emerald-600">{'\u4e0b\u8f7d\u5e76\u4f7f\u7528'}</button></div></div></div>))}{filteredOnline.length===0&&<div className="text-center text-xs text-gray-300 py-6">{'\u8f93\u5165\u5173\u952e\u8bcd\u5373\u53ef\u641c\u7d22\u5728\u7ebf\u514d\u8d39 BGM\u3002'}</div>}</div></div>}
              {bgmTab==='upload' && <div className="space-y-3"><label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-sm text-gray-400"><span>{'\u62d6\u62fd\u6216\u70b9\u51fb\u4e0a\u4f20 MP3/WAV/OGG'}</span><input type="file" accept=".mp3,.wav,.ogg" className="hidden" onChange={handleUploadBgm} /></label><div className="text-[11px] text-gray-400">{'\u4e0a\u4f20\u540e\u4f1a\u81ea\u52a8\u4fdd\u5b58\u5230\u672c\u5730\u97f3\u4e50\u5e93\uff0c\u540e\u7eed\u53ef\u76f4\u63a5\u5728\u201c\u97f3\u4e50\u5e93\u201d\u9875\u7b7e\u53cd\u590d\u4f7f\u7528\u3002'}</div></div>}
              <audio ref={previewRef} src={previewUrl} preload="auto" onEnded={()=>setPreviewUrl('')} className="mt-2 w-full" controls />
            </section>
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <SectionTitle icon={"\u{1F680}"} title={"\u751f\u6210"} extra={<div className="flex items-center gap-2 text-xs text-gray-400">{providerUsed&&<Badge variant="info">{'\u4e0a\u6b21\u6765\u6e90\uff1a'}{providerUsed}</Badge>}</div>} />
              <div className="flex items-center gap-3"><button onClick={handleSynthesize} disabled={generating||!text.trim()} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition">{generating?'\u6b63\u5728\u751f\u6210...':'\u751f\u6210\u8bed\u97f3'}</button>{audioUrl&&<a href={audioUrl} download className="px-3 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 transition">{'\u4e0b\u8f7d\u97f3\u9891'}</a>}</div>
              {genError&&<div className="mt-2 text-xs text-red-500">{genError}</div>}
              {audioUrl&&<audio controls src={audioUrl} className="mt-3 w-full" />}
            </section>
          </div>
          <div className="space-y-4">
            <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex gap-2 mb-3">{([['voice','\u97f3\u8272\u5e93'],['clone','\u58f0\u97f3\u514b\u9686'],['settings','\u8bbe\u7f6e']] as const).map(([key,label])=>(<button key={key} className={'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-white text-violet-700 shadow-sm'}>{label}</button>))}</div>
              <div className="space-y-4 text-sm"><div><div className="text-xs text-gray-500 mb-2">{'\u5f53\u524d\u97f3\u8272'}</div>{ttsMode==='edge'&&<div className="text-gray-800 font-medium">{EDGE_FALLBACK.find(v=>v.key===selectedVoice)?.label||selectedVoice}</div>}{ttsMode==='elevenlabs'&&<div className="text-gray-800 font-medium">{selectedElVoice||'\u672a\u9009\u62e9'}</div>}{ttsMode==='cosy-clone'&&<div className="text-gray-800 font-medium">{selectedCloneId||'\u672a\u9009\u62e9\u514b\u9686\u97f3\u8272'}</div>}</div><div className="border-t border-gray-100" /><div><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">{'\u4e0a\u4f20\u58f0\u97f3\u6837\u672c'}</h3></div><div className="space-y-2"><label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-xs text-gray-400"><span>{sampleFile?sampleFile.name:'\u4e0a\u4f20 10~30 \u79d2\u6e05\u6670\u4eba\u58f0 WAV/MP3'}</span><input type="file" accept=".wav,.mp3" className="hidden" onChange={e=>setSampleFile(e.target.files?.[0]||null)} /></label><button onClick={handleClone} disabled={!sampleFile||cloning} className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-medium transition">{cloning?'\u514b\u9686\u4e2d...':'\u5f00\u59cb\u514b\u9686'}</button>{cloneError&&<div className="text-xs text-red-500">{cloneError}</div>}</div></div><div className="border-t border-gray-100" /><div><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">DashScope Key</h3><Badge variant={apiKeyConfigured?'success':'default'}>{apiKeyConfigured?'\u5df2\u914d\u7f6e':'\u672a\u914d\u7f6e'}</Badge></div>{apiKeyConfigured&&<p className="text-xs text-gray-400 mb-2 font-mono">{apiKeyMasked}</p>}{showApiKey?<div className="space-y-2"><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" type="password" placeholder="sk-..." value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} /><div className="flex gap-2"><button className="flex-1 py-2 rounded-xl text-white text-xs font-medium bg-violet-500 hover:bg-violet-600 transition" onClick={handleSaveApiKey} disabled={apiKeyTesting}>{apiKeyTesting?'...':'\u4fdd\u5b58\u5e76\u6d4b\u8bd5'}</button><button className="py-2 px-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition" onClick={()=>setShowApiKey(false)}>{'\u53d6\u6d88'}</button></div>{apiKeyTestResult&&<p className={'text-xs '+(apiKeyTestResult.ok?'text-emerald-600':'text-red-600')}>{apiKeyTestResult.msg}</p>}</div>:<button className="text-xs text-violet-600 hover:text-violet-700 font-medium" onClick={()=>setShowApiKey(true)}>{apiKeyConfigured?'\u66f4\u6362 Key':'\u914d\u7f6e Key'}</button>}</div><div className="border-t border-gray-100" /><div><div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold text-gray-800">ElevenLabs Key</h3><Badge variant={elKeyConfigured?'success':'default'}>{elKeyConfigured?'\u5df2\u914d\u7f6e':'\u672a\u914d\u7f6e'}</Badge></div>{elKeyConfigured&&<p className="text-xs text-gray-400 mb-2 font-mono">{elKeyMasked}</p>}{showUsage?<div className="space-y-2"><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" type="password" placeholder="EL Key..." value={elKeyInput} onChange={e=>setElKeyInput(e.target.value)} /><div className="flex gap-2"><button className="flex-1 py-2 rounded-xl text-white text-xs font-medium bg-violet-500 hover:bg-violet-600 transition" onClick={handleSaveElKey} disabled={elKeyTesting}>{elKeyTesting?'...':'\u4fdd\u5b58\u5e76\u6d4b\u8bd5'}</button><button className="py-2 px-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition" onClick={()=>setShowUsage(false)}>{'\u53d6\u6d88'}</button></div>{elKeyTestResult&&<p className={'text-xs '+(elKeyTestResult.ok?'text-emerald-600':'text-red-600')}>{elKeyTestResult.msg}</p>}</div>:<button className="text-xs text-violet-600 hover:text-violet-700 font-medium" onClick={()=>setShowUsage(true)}>{elKeyConfigured?'\u66f4\u6362 Key':'\u914d\u7f6e Key'}</button>}</div><div className="border-t border-gray-100" /><div><h3 className="text-sm font-bold text-gray-800 mb-2">{'\u914d\u989d\u4e0e\u8fde\u901a\u6027'}</h3><button className="text-xs text-violet-600 hover:text-violet-700 font-medium" onClick={()=>{checkQuota();checkElQuota();checkDashQuota();}}>{checkingQuota?'\u68c0\u67e5\u4e2d...':'\u4e00\u952e\u68c0\u67e5'}</button>{quotaInfo&&<p className="text-xs text-gray-500 mt-2">{quotaInfo.message||(quotaInfo.available?'\u5f53\u524d\u72b6\u6001\u6b63\u5e38':'\u5f53\u524d\u4e0d\u53ef\u7528')}</p>}{elQuota&&<p className="text-xs text-gray-500 mt-1">ElevenLabs remaining: {elQuota.remaining} / {elQuota.limit}</p>}</div></div>
            </section>
          </div>
        </div>
        <footer className="text-center text-xs text-gray-300 pt-8 pb-2">{'\u58f0\u97f3\u5de5\u4f5c\u53f0 \u00b7 \u652f\u6301 Edge TTS / ElevenLabs / CosyVoice'}</footer>
      </div>
    </div>
  );
}
`;
fs.writeFileSync(path, content, 'utf-8');
console.log('wrote-clean-page-full');
