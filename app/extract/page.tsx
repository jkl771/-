'use client';
import { useState } from 'react';
export default function ExtractPage() {
  const [shareText, setShareText] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'share' | 'url' | 'text'>('share');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState<any>(null);
  // 真正执行提取的函数
  const handleExtractForce = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setDuplicate(null);
    try {
      let body: any;
      if (mode === 'share') { body = { mode: 'share', shareText }; setStep('正在处理...'); }
      else if (mode === 'url') { body = { mode: 'url', url }; setStep('正在处理...'); }
      else { body = { mode: 'text', text }; setStep('正在分析文本...'); }
      const resp = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await resp.json();
      if (data.success) { setResult(data.data); setStep(''); }
      else { setError(data.error); setStep(''); }
    } catch (e: any) { setError(e.message); setStep(''); }
    finally { setLoading(false); }
  };
  // 先检测重复，再提取
  const handleExtract = async () => {
    setLoading(true);
    setError('');
    setDuplicate(null);
    try {
      const checkResp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_duplicate', shareText, url }),
      });
      const checkData = await checkResp.json();
      if (checkData.duplicate) {
        setDuplicate(checkData.duplicate);
        setLoading(false);
        return;
      }
      // 没有重复，继续提取
      await handleExtractForce();
    } catch (e: any) {
      // 检测接口出错，直接执行提取
      await handleExtractForce();
    }
  };
  const canSubmit = (mode === 'share' && shareText.trim()) || (mode === 'url' && url.trim()) || (mode === 'text' && text.trim());
  const sourceLabel: Record<string, string> = {
    funasr: '🎙 语音识别 (FunASR)', description: '📝 视频描述', pasted: '📋 手动粘贴',
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🔗 链接文案提取</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">粘贴分享链接 → 自动下载视频 → 提取音频 → 语音转文字（免费，无需 API Key）</p>
      {/* 重复检测提示 */}
      {duplicate && (
        <div className="card border-yellow-300 bg-yellow-50 mb-6">
          <p className="text-yellow-800 font-medium">⚠️ 该视频已提取过！</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">标题：{duplicate.title}，作者：{duplicate.author}，平台：{duplicate.platform}</p>
          <div className="flex gap-3 mt-3">
            <a href={`/materials?id=${duplicate.id}`} className="btn-primary text-sm">📦 查看素材</a>
            <button onClick={() => { setDuplicate(null); handleExtractForce(); }} className="btn-secondary text-sm">🔄 仍然重新提取</button>
          </div>
        </div>
      )}
      <div className="card mb-6">
        <div className="flex gap-3 mb-5">
          <button onClick={() => setMode('share')} className={mode === 'share' ? 'btn-primary' : 'btn-secondary'}>📋 粘贴分享文本</button>
          <button onClick={() => setMode('url')} className={mode === 'url' ? 'btn-primary' : 'btn-secondary'}>🔗 输入链接</button>
          <button onClick={() => setMode('text')} className={mode === 'text' ? 'btn-primary' : 'btn-secondary'}>📝 粘贴纯文案</button>
        </div>
        {mode === 'share' && (
          <div>
            <label className="label">粘贴抖音/快手分享内容</label>
            <textarea className="input-field h-36 mb-2 font-mono text-sm"
              placeholder={'直接从 App 复制分享内容粘贴到这里：\n\n4.66 :4pm S@L.wS eOX:/ 12/21 你你以为的垃圾食品... https://v.douyin.com/xxx/ 复制此链接，打开Dou音搜索，直接观看视频。'}
              value={shareText} onChange={(e) => setShareText(e.target.value)} />
          </div>
        )}
        {mode === 'url' && (
          <div>
            <label className="label">视频链接</label>
            <input className="input-field mb-2" placeholder="https://www.douyin.com/video/..." value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        )}
        {mode === 'text' && (
          <div>
            <label className="label">粘贴文案内容</label>
            <textarea className="input-field h-40 mb-4" placeholder="将文案内容直接粘贴到这里..." value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={handleExtract} disabled={loading || !canSubmit} className="btn-primary">
            {loading ? '⏳ 处理中...' : '🚀 开始提取'}
          </button>
          <a href="/scripts" className="btn-secondary">📋 文案库</a>
        </div>
        {loading && (
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-sm text-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="animate-spin">⏳</span>
              <span className="font-medium">{step || '正在处理...'}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span>①</span>
                <span>解析链接...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span>②</span>
                <span>获取视频信息...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span>③</span>
                <span>下载音频...</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <span>④</span>
                <span>语音转文字...</span>
              </div>
            </div>
            <p className="text-xs text-blue-500 mt-3">处理时间取决于视频时长，通常 30-60 秒。首次需加载模型约 20 秒，之后会更快。</p>
          </div>
        )}
      </div>
      {error && (
        <div className="card border-red-200 bg-red-50 dark:bg-red-900/30 mb-6">
          <p className="text-red-600 font-medium">❌ {error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">可尝试「📝 粘贴纯文案」模式手动输入文案</p>
        </div>
      )}
      {result && (
        <div className="space-y-6">
          <div className="card border-green-200 bg-green-50">
            <p className="text-green-700 font-medium">✅ 提取成功！文案已保存到文案库</p>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">📊 提取结果</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">标题</span>
                <span className="font-medium text-sm">{result.title}</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">作者</span>
                <span className="font-medium text-sm">{result.author || '-'}</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">平台</span>
                <span className="font-medium text-sm">{result.platform || result.metadata?.platform || '-'}</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">时长</span>
                <span className="font-medium text-sm">
                  {result.metadata?.duration ? `${Math.floor(result.metadata.duration / 60)}分${Math.floor(result.metadata.duration % 60)}秒` : '-'}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">识别方式</span>
                <span className="font-medium text-sm">{sourceLabel[result.metadata?.source] || result.metadata?.source || '-'}</span>
              </div>
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 block">字数</span>
                <span className="font-medium text-sm">{result.rawText?.length || 0} 字</span>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">📄 完整文案</h3>
              <button className="text-xs text-blue-600 hover:underline" onClick={() => navigator.clipboard.writeText(result.rawText)}>📋 复制</button>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 text-sm max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">{result.rawText}</div>
          </div>
          {result.segments?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">⏱ 时间轴（{result.segments.length} 段）</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {result.segments.map((seg: any, i: number) => (
                  <div key={i} className="flex gap-3 py-2 px-3 rounded hover:bg-blue-50 dark:bg-blue-900/30 text-sm border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <span className="font-mono text-blue-600 text-xs min-w-[50px]">
                      {seg.startTime != null ? `${Math.floor(seg.startTime / 60)}:${String(Math.floor(seg.startTime % 60)).padStart(2, '0')}` : ''}
                    </span>
                    <span className="flex-1">{seg.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="card">
            <h3 className="font-semibold mb-3">下一步</h3>
            <div className="flex flex-wrap gap-3">
              <a href={`/scripts?id=${result.id}`} className="btn-primary text-sm">📋 查看完整详情</a>
              <a href={`/polish?from=${result.id}`} className="btn-secondary text-sm">✅ 去润色合规</a>
              <a href={`/cover?from=${result.id}`} className="btn-secondary text-sm">🎨 生成封面</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}