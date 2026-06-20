'use client';

import { useState, useEffect } from 'react';

interface RetalkRecord {
  id: string;
  videoUrl: string;
  durationSec: number;
  estimatedCost: number;
  createdAt: string;
}

// metadata removed (client component) = { title: '数字人形象 - 视频智能体' };

export default function AvatarPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [retalkQuota, setRetalkQuota] = useState<{ totalSec: number; pricePerSec: number; dashAvailable?: boolean; dashMessage?: string } | null>(null);
  const [dashQuotaOk, setDashQuotaOk] = useState<boolean | null>(null);
  const [dashQuotaMsg, setDashQuotaMsg] = useState('');
  const [history, setHistory] = useState<RetalkRecord[]>([]);

  useEffect(() => {
    fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retalk_key', subAction: 'get' }) })
      .then(r => r.json()).then(d => { if (d.success) setApiKeyConfigured(d.data.configured); }).catch(() => {});
    checkRetalkQuota();
    checkDashQuota();
    loadHistory();
  }, []);

  const checkRetalkQuota = async () => {
    try {
      const r = await fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retalk_info' }) });
      const d = await r.json();
      if (d?.success && d?.data) {
        setRetalkQuota(d.data);
        if (d.data.dashAvailable === false) { setDashQuotaOk(false); setDashQuotaMsg(d.data.dashMessage || '额度异常'); }
      } else { setRetalkQuota(null); }
    } catch { setRetalkQuota(null); }
  };
  const checkDashQuota = async () => {
    try {
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'quota' }) });
      const d = await r.json();
      if (d?.success && d?.data?.available === false) { setDashQuotaOk(false); setDashQuotaMsg(d.data.message || '额度异常'); }
      else { setDashQuotaOk(true); setDashQuotaMsg(d?.data?.message || ''); }
    } catch { setDashQuotaOk(null); setDashQuotaMsg(''); }
  };
  const loadHistory = async () => {
    try {
      const r = await fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retalk_history' }) });
      const d = await r.json();
      if (d?.success && Array.isArray(d.data)) setHistory(d.data);
    } catch {}
  };

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    await fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retalk_key', subAction: 'save', apiKey: apiKeyInput.trim() }) });
    setApiKeyInput('');
    fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retalk_key', subAction: 'get' }) })
      .then(r => r.json()).then(d => { if (d.success) setApiKeyConfigured(d.data.configured); }).catch(() => {});
  };

  const handleTestKey = async () => {
    setTestResult(null);
    try {
      const r = await fetch('/api/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'retalk_key', subAction: 'test', force: true }) });
      const d = await r.json();
      setTestResult({ ok: d.success, msg: d.success ? '连接成功！' : (d.error || '测试失败') });
    } catch (e: any) { setTestResult({ ok: false, msg: e.message }); }
  };

  const handleGenerate = async () => {
    if (!videoFile) { alert('请上传人物视频'); return; }
    if (!audioFile) { alert('请上传人声音频'); return; }
    if (dashQuotaOk === false) { const ok = confirm('当前阿里云额度提示：' + (dashQuotaMsg || '额度不足') + '，仍要尝试生成吗？'); if (!ok) return; }
    setGenerating(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.set('action', 'retalk');
      fd.set('video', videoFile);
      fd.set('audio', audioFile);
      const r = await fetch('/api/avatar', { method: 'POST', body: fd });
      const d = await r.json();
      if (d.success) { setResult(d.data); loadHistory(); }
      else setError(d.error || '生成失败');
    } catch (e: any) { setError(e.message); } finally { setGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">数字人口型视频</h1>
          <p className="text-sm text-gray-500 mt-2">上传你的人物视频 + 人声音频，AI 自动生成口型匹配的新视频</p>
        </header>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">阿里云 API Key</h2>
            <button className="text-sm text-blue-600 hover:underline" onClick={() => setShowKey(!showKey)}>{showKey ? '收起' : '配置'}</button>
          </div>
          {showKey && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">需要阿里云 DashScope API Key，一个 Key 可用于 TTS + 数字人。<a href="https://bailian.console.aliyun.com/cn-beijing?tab=globalset#/efm/api_key" target="_blank" className="text-blue-600 hover:underline ml-1">点击获取</a></p>
              <div className="flex gap-2">
                <input type="password" className="input-field flex-1" placeholder="输入你的 DashScope API Key" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} />
                <button className="btn-secondary text-sm" onClick={handleSaveKey}>保存</button>
                <button className="btn-secondary text-sm" onClick={handleTestKey}>测试</button>
              </div>
              {apiKeyConfigured && <p className="text-xs text-green-600">API Key 已配置</p>}
              {testResult && <p className={'text-xs ' + (testResult.ok ? 'text-green-600' : 'text-red-600')}>{testResult.msg}</p>}
            </div>
          )}
        </div>

        <div className="card bg-amber-50/60 border-amber-200 space-y-2">
          <h3 className="font-bold text-gray-800">价格说明</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>单价：<span className="font-mono font-bold">{retalkQuota?.pricePerSec ?? 0.08} 元/秒</span></p>
            <p>免费额度：<span className="font-mono font-bold">{retalkQuota?.totalSec ?? 1800} 秒（30 分钟）</span></p>
            <p>1 分钟视频 ≈ <span className="font-mono font-bold">4.8 元</span> | 5 分钟视频 ≈ <span className="font-mono font-bold">24 元</span></p>
          </div>
        </div>

        {retalkQuota && <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-1.5">数字人免费额度：{retalkQuota.totalSec}s，单价 {retalkQuota.pricePerSec} 元/秒</p>}
        {dashQuotaOk === false && <p className="text-xs text-red-700 bg-red-50 rounded-md px-3 py-1.5">阿里云额度提醒：{dashQuotaMsg || '额度不足，请充值后再试'}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-3">
            <h3 className="font-bold text-gray-800">人物视频</h3>
            <p className="text-xs text-gray-500">上传正面、清晰的人物说话视频</p>
            <label className="block w-full px-5 py-8 rounded-xl border-2 border-dashed border-blue-200 text-center text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
              {videoFile ? <span className="text-gray-700 font-medium">{videoFile.name}</span> : '点击选择视频文件'}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
            </label>
            {videoFile && <button className="text-xs text-red-400 hover:text-red-600" onClick={() => setVideoFile(null)}>移除</button>}
          </div>
          <div className="card space-y-3">
            <h3 className="font-bold text-gray-800">人声音频</h3>
            <p className="text-xs text-gray-500">上传你想要的说话音频（或从 TTS 页生成）</p>
            <label className="block w-full px-5 py-8 rounded-xl border-2 border-dashed border-purple-200 text-center text-sm text-gray-500 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all">
              {audioFile ? <span className="text-gray-700 font-medium">{audioFile.name}</span> : '点击选择音频文件'}
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
            </label>
            {audioFile && <button className="text-xs text-red-400 hover:text-red-600" onClick={() => setAudioFile(null)}>移除</button>}
          </div>
        </div>

        <button className="btn-primary w-full text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all" onClick={handleGenerate} disabled={generating || !videoFile || !audioFile || !apiKeyConfigured}>
          {generating ? '生成中...' : '生成口型视频'}
        </button>

        {error && <div className="card border-l-4 border-red-500 p-4"><span className="text-sm text-red-600">{error}</span></div>}

        {result && (
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <span className="badge-success">生成成功</span>
              {result.durationSec > 0 && <span className="text-xs text-gray-500">时长: {result.durationSec}s | 预估费用: ¥{result.estimatedCost}</span>}
            </div>
            <video controls className="w-full rounded-lg" src={result.videoUrl} />
            <a href={result.videoUrl} download className="btn-secondary text-sm inline-block">下载视频</a>
          </div>
        )}

        {/* 生成历史 */}
        {history.length > 0 && (
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-800">📋 生成历史（{history.length} 条）</h2>
            <div className="space-y-3">
              {history.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.id}</p>
                    <p className="text-xs text-gray-500">
                      时长: {r.durationSec}s | 费用: ¥{r.estimatedCost} | {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <a href={r.videoUrl} target="_blank" className="btn-secondary text-xs">预览</a>
                    <a href={r.videoUrl} download className="btn-secondary text-xs">下载</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card bg-gray-50 space-y-3">
          <h3 className="font-bold text-gray-800">使用说明</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>1. 先配置阿里云 DashScope API Key</li>
            <li>2. 上传一段正面、清晰的人物说话视频</li>
            <li>3. 上传你想要的说话音频（可从 TTS 页生成）</li>
            <li>4. 点击生成，等待 AI 处理（通常 1~5 分钟）</li>
            <li>5. 生成完成后可预览和下载，历史记录自动保存</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
