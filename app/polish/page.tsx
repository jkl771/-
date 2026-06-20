'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs py-0.5">
      <span className="w-14 text-gray-500 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full score-bar-fill" style={{ width: value + '%', backgroundColor: color }} />
      </div>
      <span className="w-7 text-gray-600 font-medium text-right shrink-0">{value}</span>
    </div>
  );
}
function ScorePanel({ score, title, compact }: { score: any; title: string; compact?: boolean }) {
  if (!score) return null;
  if (compact) {
    return (
      <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-600">{title}</span>
          <span className="text-base font-bold" style={{ color: score.overall >= 70 ? '#16a34a' : score.overall >= 50 ? '#ca8a04' : '#dc2626' }}>{score.overall}</span>
        </div>
        <ScoreBar label="可读性" value={score.readability} color="#3b82f6" />
        <ScoreBar label="信息量" value={score.infoDensity} color="#8b5cf6" />
        <ScoreBar label="情绪力" value={score.emotionPower} color="#f59e0b" />
        <ScoreBar label="钩子力" value={score.hookStrength} color="#ef4444" />
        <ScoreBar label="句式" value={score.sentenceVariety} color="#06b6d4" />
        <ScoreBar label="长度" value={score.lengthFit} color="#10b981" />
        <ScoreBar label="平台" value={score.platformFit} color="#6366f1" />
        <ScoreBar label="风险" value={100 - score.forbiddenRisk} color="#22c55e" />
        {score.aiDetection !== undefined && <ScoreBar label="人味" value={100 - score.aiDetection} color="#a855f7" />}
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-0.5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold" style={{ color: score.overall >= 70 ? '#16a34a' : score.overall >= 50 ? '#ca8a04' : '#dc2626' }}>{score.overall}</span>
          <span className="text-xs text-gray-400">分</span>
        </div>
      </div>
      <ScoreBar label="可读性" value={score.readability} color="#3b82f6" />
      <ScoreBar label="信息量" value={score.infoDensity} color="#8b5cf6" />
      <ScoreBar label="情绪力" value={score.emotionPower} color="#f59e0b" />
      <ScoreBar label="钩子力" value={score.hookStrength} color="#ef4444" />
      <ScoreBar label="句式" value={score.sentenceVariety} color="#06b6d4" />
      <ScoreBar label="长度" value={score.lengthFit} color="#10b981" />
      <ScoreBar label="平台" value={score.platformFit} color="#6366f1" />
      <ScoreBar label="风险" value={100 - score.forbiddenRisk} color="#22c55e" />
      {score.aiDetection !== undefined && <ScoreBar label="人味" value={100 - score.aiDetection} color="#a855f7" />}
      {score.method && <div className="text-xs text-gray-400 pt-1">{score.method === 'llm' ? '🤖 AI评分' : '📐 规则评分'}</div>}
      {score.details?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
          {score.details.map((d: string, i: number) => <div key={i} className="text-xs text-gray-500 leading-relaxed">{d}</div>)}
        </div>
      )}
    </div>
  );
}
function PolishPageInner() {
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from');
  const [text, setText] = useState('');
  const [style, setStyle] = useState('casual');
  const [mode, setMode] = useState('rewrite');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [editText, setEditText] = useState('');
  const [editScore, setEditScore] = useState<any>(null);
  const [editCompliance, setEditCompliance] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [scoringEdit, setScoringEdit] = useState(false);
  const [tokenUsage, setTokenUsage] = useState<any>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiMsg, setAiMsg] = useState('');
  const [showLLM, setShowLLM] = useState(false);
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmStatus, setLlmStatus] = useState<'idle'|'testing'|'ok'|'fail'>('idle');
  const [llmMsg, setLlmMsg] = useState('');
  const [llmConnected, setLlmConnected] = useState(false);
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    setLlmBaseUrl(localStorage.getItem('llm_base_url') || '');
    setLlmApiKey(localStorage.getItem('llm_api_key') || '');
    setLlmModel(localStorage.getItem('llm_model') || '');
    if (localStorage.getItem('llm_connected') === 'true') { setLlmConnected(true); setLlmStatus('ok'); }
    setInitialized(true);
  }, []);
  const handleAiToggle = async () => {
    if (!aiEnabled) {
      setAiTesting(true); setAiMsg('');
      try {
        const res = await fetch('/api/polish', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'ok', style: 'casual', mode: 'rewrite', useAI: true }),
        });
        const d = await res.json();
        if (d.success) { setAiEnabled(true); setAiMsg('✅ AI 已启用'); }
        else setAiMsg('❌ ' + (d.error || '连接失败'));
      } catch (e: any) { setAiMsg('❌ ' + e.message); }
      finally { setAiTesting(false); }
    } else {
      setAiEnabled(false); setAiMsg('');
    }
  };
  const saveLLMConfig = () => {
    localStorage.setItem('llm_base_url', llmBaseUrl);
    localStorage.setItem('llm_api_key', llmApiKey);
    localStorage.setItem('llm_model', llmModel);
    setLlmConnected(false); setLlmStatus('idle'); localStorage.removeItem('llm_connected'); setAiEnabled(false);
    setLlmMsg('✅ 已保存，请测试连接');
  };
  const testLLMConnection = async () => {
    if (!llmBaseUrl || !llmApiKey) { setLlmMsg('❌ 请先填写 Base URL 和 API Key'); return; }
    setLlmStatus('testing'); setLlmMsg('测试中...');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${llmBaseUrl}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${llmApiKey}` },
        body: JSON.stringify({ model: llmModel || 'glm-4-flash', messages: [{ role: 'user', content: '回复ok' }], max_tokens: 5 }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) { setLlmStatus('ok'); setLlmConnected(true); localStorage.setItem('llm_connected', 'true'); setAiEnabled(false); setLlmMsg('✅ 连接成功！'); }
      else { setLlmStatus('fail'); setLlmConnected(false); setLlmMsg('❌ HTTP ' + res.status); }
    } catch (e: any) { setLlmStatus('fail'); setLlmConnected(false); setLlmMsg('❌ ' + (e.name === 'AbortError' ? '超时' : e.message)); }
  };
  const clearLLMConfig = () => {
    localStorage.removeItem('llm_base_url'); localStorage.removeItem('llm_api_key');
    localStorage.removeItem('llm_model'); localStorage.removeItem('llm_connected');
    setLlmBaseUrl(''); setLlmApiKey(''); setLlmModel('');
    setLlmConnected(false); setLlmStatus('idle'); setLlmMsg('🗑️ 配置已清除');
  };
  useEffect(() => { if (fromId) fetch(`/api/extract?id=${fromId}`).then(r=>r.json()).then(d=>{ if(d.success&&d.data?.rawText) setText(d.data.rawText); }).catch(()=>{}); }, [fromId]);
  const getLLMConfig = () => (!llmConnected||!llmApiKey||!llmBaseUrl) ? undefined : { baseUrl: llmBaseUrl, apiKey: llmApiKey, model: llmModel || 'glm-4-flash' };
  const handlePolish = async () => {
    setLoading(true); setError(''); setAddMsg(''); setIsEditing(false); setTokenUsage(null);
    try {
      const resp = await fetch('/api/polish', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, style, mode, useAI: aiEnabled, llmConfig: aiEnabled ? undefined : getLLMConfig() }) });
      const data = await resp.json();
      if (data.success) {
        setResult(data.data); setEditText(data.data.polished); setEditScore(data.data.polishedScore); setEditCompliance(data.data.complianceReport);
        if (data.data.tokenUsage) setTokenUsage(data.data.tokenUsage);
      } else setError(data.error);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  const handleEditChange = (newText: string) => { setEditText(newText); setIsEditing(newText !== result?.polished); };
  const handleSubmitScore = async () => {
    setScoringEdit(true);
    try {
      const res = await fetch('/api/polish', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: editText, style:'casual', mode:'rewrite', useAI: aiEnabled, llmConfig: aiEnabled ? undefined : getLLMConfig() }) });
      const d = await res.json();
      if (d.success && d.data) { setEditScore(d.data.polishedScore); setEditCompliance(d.data.complianceReport); setIsEditing(false); }
    } catch {} finally { setScoringEdit(false); }
  };
  const handleAddToLibrary = async (t: string) => {
    setAddMsg('');
    try { const r = await fetch('/api/materials-library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',texts:[t]})}); const d=await r.json(); setAddMsg(d.success?'✅ 已加入候选区':'❌ '+(d.error||'失败')); } catch(e:any){ setAddMsg('❌ '+e.message); }
  };
  const handleUseVersion = (v: string, vs: any) => { setEditText(v); setEditScore(vs); setEditCompliance(null); setIsEditing(false); };
  if (!initialized) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  return (
    <div className="space-y-5">
      {/* 标题 */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">✨ 文案润色</h1>
        <a href="/materials-library" className="text-sm text-blue-500 hover:text-blue-700 transition-colors">📚 素材库</a>
      </div>
      {/* 输入区 */}
      <div className="card">
        <textarea className="w-full h-36 p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white resize-y transition-colors" placeholder="粘贴需要润色的文案..." value={text} onChange={e => setText(e.target.value)} />
        <div className="flex items-center gap-2 mt-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm shrink-0">
            {[["casual","🗣️ 口语化"],["storytelling","📖 故事化"],["sales","🛒 带货"],["educational","🎓 知识"]].map(([v,l]: any)=>(
              <button key={v} onClick={()=>setStyle(v)} className={`px-3 py-1.5 transition-colors ${style===v?"bg-blue-500 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
            ))}
          </div>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm shrink-0">
            {[["rewrite","✏️ 改写"],["expand","📐 扩充"],["condense","📎 精简"]].map(([v,l]: any)=>(
              <button key={v} onClick={()=>setMode(v)} className={`px-3 py-1.5 transition-colors ${mode===v?"bg-blue-500 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>{l}</button>
            ))}
          </div>
          <button onClick={handlePolish} disabled={loading||!text} className="btn-primary text-sm ml-auto shrink-0">
            {loading ? "⏳ 润色中..." : llmConnected ? "🤖 AI 润色" : "✨ 开始润色"}
          </button>
          {tokenUsage && <span className="text-xs text-gray-400 ml-1 shrink-0">🪙 {tokenUsage.total_tokens}t</span>}
        </div>
        {/* LLM 配置（折叠） */}
        {/* AI 润色开关 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={handleAiToggle} disabled={aiTesting||llmConnected}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                aiEnabled ? 'bg-green-500 text-white shadow-md' : llmConnected ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {aiTesting ? '⏳ 测试中...' : aiEnabled ? '🤖 AI 已启用' : '🤖 启用 AI 润色'}
            </button>
            {aiMsg && <span className={`text-xs ${aiMsg.startsWith('✅')?'text-green-500':'text-red-500'}`}>{aiMsg}</span>}
            {aiEnabled && <span className="text-xs text-gray-400">固定模型: GLM-4-Flash</span>}
            <span className="text-xs text-gray-300 mx-1">|</span>
            <button onClick={() => setShowLLM(!showLLM)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              📦 自定义配置{showLLM ? ' ▲' : ' ▼'}{llmConnected && <span className="ml-1.5 text-green-500">●</span>}
            </button>
          </div>
          {showLLM && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-400 mb-1">填写自己的 API 配置（优先级高于固定模型）</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input className="input-field text-xs" placeholder="Base URL" value={llmBaseUrl} onChange={e => setLlmBaseUrl(e.target.value)} />
                <input className="input-field text-xs" type="password" placeholder="API Key" value={llmApiKey} onChange={e => setLlmApiKey(e.target.value)} />
                <input className="input-field text-xs" placeholder="模型名" value={llmModel} onChange={e => setLlmModel(e.target.value)} />
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={saveLLMConfig} className="text-xs text-blue-500 hover:text-blue-700">💾 保存</button>
                <button onClick={testLLMConnection} disabled={llmStatus==='testing'} className={`text-xs px-2 py-1 rounded-lg ${llmStatus==='testing'?'text-gray-400':llmStatus==='ok'?'text-green-600 bg-green-50':llmStatus==='fail'?'text-red-600 bg-red-50':'text-blue-500'}`}>
                  {llmStatus==='testing'?'⏳...':'🔍 测试'}
                </button>
                <button onClick={clearLLMConfig} className="text-xs text-red-400 hover:text-red-600">🗑️ 清除</button>
                {llmMsg && <span className={`text-xs ${llmStatus==='ok'?'text-green-500':llmStatus==='fail'?'text-red-500':'text-gray-400'}`}>{llmMsg}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
      {error && <div className="card-compact border-red-200 bg-red-50"><p className="text-red-600 text-sm">❌ {error}</p></div>}
      {addMsg && <div className="card-compact border-blue-200 bg-blue-50"><p className="text-blue-600 text-sm">{addMsg}</p></div>}
      {result && (
        <>
          {/* 合规报告 + 评分详情 合并 */}
          <div className="card-compact">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold" style={{ color: (editCompliance?.passed ?? result.complianceReport.passed) ? '#16a34a' : '#dc2626' }}>
                  {editCompliance?.score ?? result.complianceReport.score}分
                </span>
                {(editCompliance?.passed ?? result.complianceReport.passed) ? <span className="badge-success">✅ 合规</span> : <span className="badge-error">⚠️ 有问题</span>}
                <span className="badge-info">原创 {result.originalityScore}%</span>
              </div>
              <div className="flex items-center gap-1">
                {(editScore ?? result.polishedScore) && (
                  <span className="text-xl font-bold" style={{ color: (editScore ?? result.polishedScore).overall >= 70 ? '#16a34a' : (editScore ?? result.polishedScore).overall >= 50 ? '#ca8a04' : '#dc2626' }}>
                    {(editScore ?? result.polishedScore).overall}<span className="text-xs text-gray-400 ml-0.5">分</span>
                  </span>
                )}
                {(editScore ?? result.polishedScore)?.method && <span className="text-xs text-gray-400 ml-1">{(editScore ?? result.polishedScore).method === 'llm' ? '🤖' : '📐'}</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-2">
              {[
                { label: '违禁词', value: ((editCompliance ?? result.complianceReport)?.stats?.forbiddenCount ?? 0), icon: '🚫', ok: ((editCompliance ?? result.complianceReport)?.stats?.forbiddenCount ?? 0) === 0 },
                { label: '敏感词', value: ((editCompliance ?? result.complianceReport)?.stats?.sensitiveCount ?? 0), icon: '⚠️', ok: ((editCompliance ?? result.complianceReport)?.stats?.sensitiveCount ?? 0) === 0 },
                { label: '脏话', value: ((editCompliance ?? result.complianceReport)?.stats?.dirtyCount ?? 0), icon: '🔇', ok: ((editCompliance ?? result.complianceReport)?.stats?.dirtyCount ?? 0) === 0 },
                { label: '句长', value: ((editCompliance ?? result.complianceReport)?.stats?.avgSentenceLen ?? 0) + '字', icon: '📏', ok: ((editCompliance ?? result.complianceReport)?.stats?.avgSentenceLen ?? 30) <= 35 },
                { label: '评分', value: (editScore ?? result.polishedScore)?.overall ?? '-', icon: '📊', ok: ((editScore ?? result.polishedScore)?.overall ?? 0) >= 60 },
              ].map((item, idx) => (
                <div key={idx} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${item.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-auto font-bold">{String(item.value)}</span>
                </div>
              ))}
            </div>
            {((editCompliance?.issues ?? result.complianceReport.issues) || []).length > 0 && (
              <div className="mb-2">
                {(editCompliance?.issues ?? result.complianceReport.issues)?.map((issue: any, i: number) => (
                  <div key={i} className="text-xs text-red-500 mb-0.5 bg-red-50 rounded px-2 py-1">• <span className="font-medium">{issue.word}</span> → {issue.suggestion}</div>
                ))}
              </div>
            )}
            {(editScore ?? result.polishedScore)?.details?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(editScore ?? result.polishedScore).details.map((d: string, i: number) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${d.startsWith('✅') ? 'bg-green-50 text-green-700' : d.startsWith('⚠️') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{d}</span>
                ))}
              </div>
            )}
          </div>
          {/* 润色结果 */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700">📝 润色结果</h2>
              <div className="flex items-center gap-2">
                {isEditing && <span className="text-xs text-amber-500">已编辑</span>}
                {scoringEdit && <span className="text-xs text-blue-500">评分中...</span>}
                {!isEditing && !scoringEdit && editText && <span className="text-xs text-green-500">✓</span>}
                {isEditing && <button onClick={handleSubmitScore} disabled={scoringEdit} className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">{scoringEdit ? '⏳' : '📊 提交评分'}</button>}
              </div>
            </div>
            <textarea className="w-full h-32 p-3 rounded-xl border border-gray-200 bg-sky-50/50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y" value={editText} onChange={e => handleEditChange(e.target.value)} />
            <div className="flex gap-2 mt-2 flex-wrap">
              <a href="/tts" className="btn-secondary text-xs">→ 语音</a>
              <a href="/cover" className="btn-secondary text-xs">→ 封面</a>
              <button onClick={() => handleAddToLibrary(editText)} className="btn-secondary text-xs">📚 入库</button>
              <button onClick={() => handleAddToLibrary(text)} className="btn-secondary text-xs">📚 原文入库</button>
            </div>
          </div>
          {/* 多版本 */}
          <div className="card-compact">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🔄 多版本改写（{result.versions.length}）</h2>
            <div className="space-y-2">
              {result.versions.map((v: string, i: number) => {
                const vs = result.versionScores?.[i];
                const isBest = v === result.polished;
                return (
                  <details key={i} className={`rounded-xl ${isBest ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <summary className="p-3 cursor-pointer text-sm flex justify-between items-center">
                      <span className="font-medium text-gray-700">
                        {isBest && <span className="text-green-600 mr-1">★</span>}版本 {i + 1}
                      </span>
                      {vs && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: vs.overall >= 70 ? '#dcfce7' : vs.overall >= 50 ? '#fef9c3' : '#fee2e2', color: vs.overall >= 70 ? '#16a34a' : vs.overall >= 50 ? '#ca8a04' : '#dc2626' }}>{vs.overall}分</span>}
                    </summary>
                    <div className="px-3 pb-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{v}</div>
                    {vs && <div className="px-3 pb-2"><ScorePanel score={vs} title={`版本 ${i+1}`} compact /></div>}
                    <div className="px-3 pb-3 flex gap-2">
                      <button onClick={() => handleUseVersion(v, vs)} className="text-xs text-blue-500 hover:text-blue-700">📝 使用</button>
                      <button onClick={() => handleAddToLibrary(v)} className="text-xs text-green-500 hover:text-green-700">📚 入库</button>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default function PolishPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">加载中...</div>}>
      <PolishPageInner />
    </Suspense>
  );
}