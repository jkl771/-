'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ScriptsPageInner() {
  const searchParams = useSearchParams();
  const viewId = searchParams.get('id');
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 加载列表
  useEffect(() => {
    if (!viewId) {
      fetch('/api/extract').then(r => r.json()).then(d => {
        if (d.success) setList(d.data);
      }).catch(() => setError('加载失败，请检查网络'));
    }
  }, [viewId]);

  // 加载详情
  useEffect(() => {
    if (viewId) {
      setLoading(true);
      fetch(`/api/extract?id=${viewId}`).then(r => r.json()).then(d => {
        if (d.success) setDetail(d.data);
        setLoading(false);
      }).catch(() => { setLoading(false); setError('加载详情失败'); });
    }
  }, [viewId]);

  const handleSearch = () => {
    setLoading(true);
    fetch(`/api/extract?q=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setList(d.data);
        setLoading(false);
      }).catch(() => { setLoading(false); setError('搜索失败'); });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该文案？删除后不可恢复。')) return;
    const resp = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const data = await resp.json();
    if (data.success) {
      setList(prev => prev.filter(item => item.id !== id));
    }
  };

  const sourceLabel: Record<string, string> = {
    funasr: '🎙 语音识别',
    whisper_api: '🎙 Whisper API',
    description: '📝 视频描述',
    pasted: '📋 手动粘贴',
  };

  // 详情视图
  if (viewId) {
    if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (error) return <div className="text-center py-20 text-red-400">{error} <button className="text-blue-600 ml-2" onClick={() => { setError(''); window.location.reload(); }}>重试</button></div>;
    if (!detail) return <div className="text-center py-20 text-gray-400">未找到该文案</div>;

    const meta = detail.metadata || {};
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <a href="/scripts" className="text-blue-600 hover:underline text-sm">← 返回列表</a>
          <h1 className="text-2xl font-bold">📊 文案详情</h1>
        </div>

        <div className="card mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">标题</span>
              <span className="font-medium text-sm">{detail.title}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">作者</span>
              <span className="font-medium text-sm">{detail.author || '-'}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">平台</span>
              <span className="font-medium text-sm">{meta.platform || detail.platform || '-'}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">时长</span>
              <span className="font-medium text-sm">
                {meta.duration ? `${Math.floor(meta.duration / 60)}分${Math.floor(meta.duration % 60)}秒` : '-'}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">识别方式</span>
              <span className="font-medium text-sm">{sourceLabel[meta.source] || meta.source || '-'}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-xs text-gray-500 block">字数</span>
              <span className="font-medium text-sm">{detail.rawText?.length || 0} 字</span>
            </div>
          </div>
          {meta.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {meta.tags.map((tag: string, i: number) => (
                <span key={i} className="bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">📄 完整文案</h2>
            <button className="text-xs text-blue-600 hover:underline" onClick={() => navigator.clipboard.writeText(detail.rawText)}>
              📋 复制
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-sm max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {detail.rawText}
          </div>
        </div>

        {detail.segments?.length > 0 && (
          <div className="card mb-6">
            <h2 className="font-semibold mb-3">⏱ 时间轴（{detail.segments.length} 段）</h2>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {detail.segments.map((seg: any, i: number) => (
                <div key={i} className="flex gap-3 py-2 px-3 rounded hover:bg-blue-50 transition-colors text-sm border-b border-gray-100 last:border-0">
                  <span className="font-mono text-blue-600 whitespace-nowrap text-xs pt-0.5 min-w-[50px]">
                    {seg.startTime != null
                      ? `${Math.floor(seg.startTime / 60)}:${String(Math.floor(seg.startTime % 60)).padStart(2, '0')}`
                      : ''}
                  </span>
                  <span className="flex-1">{seg.text}</span>
                  <span className="text-gray-400 text-xs whitespace-nowrap">
                    {seg.endTime != null && seg.endTime > 0
                      ? `${Math.floor(seg.endTime / 60)}:${String(Math.floor(seg.endTime % 60)).padStart(2, '0')}`
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="font-semibold mb-3">下一步操作</h2>
          <div className="flex flex-wrap gap-3">
            <a href={`/polish?from=${viewId}`} className="btn-primary text-sm">✅ 润色合规</a>
            <a href={`/tts?from=${viewId}`} className="btn-secondary text-sm">🎙 语音合成</a>
            <a href={`/editor?from=${viewId}`} className="btn-secondary text-sm">🎬 视频剪辑</a>
            <a href={`/cover?from=${viewId}`} className="btn-secondary text-sm">🎨 生成封面</a>
          </div>
        </div>
      </div>
    );
  }

  // 列表视图
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📋 文案库</h1>
        <a href="/extract" className="btn-primary text-sm">+ 提取新文案</a>
      </div>

      {/* 搜索框 */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="搜索文案标题、作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
        <button onClick={handleSearch} className="btn-primary text-sm">🔍 搜索</button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>还没有提取过文案</p>
          <a href="/extract" className="text-blue-600 hover:underline text-sm mt-2 inline-block">去提取第一个文案 →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {list.length === 0 ? (<div className='text-center text-gray-400 py-8'>暂无文案，去<a href='/extract' className='text-blue-600 hover:underline'>提取页面</a>添加</div>) : list.map((item: any) => {
            const meta = item.metadata || {};
            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start">
                  <a href={`/scripts?id=${item.id}`} className="flex-1 block">
                    <h3 className="font-semibold group-hover:text-blue-600 transition-colors mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {item.rawText?.slice(0, 120)}...
                    </p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>{item.author}</span>
                      <span>{meta.duration ? `${Math.floor(meta.duration / 60)}分${Math.floor(meta.duration % 60)}秒` : ''}</span>
                      <span>{item.rawText?.length || 0} 字</span>
                      <span className="bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 text-xs">{meta.platform || item.platform || ''}</span>
                    <span>{sourceLabel[meta.source] || ''}</span>
                      <span>{item.segments?.length || 0} 段</span>
                    </div>
                  </a>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-600 hover:underline">🗑️ 删除</button>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">加载中...</div>}>
      <ScriptsPageInner />
    </Suspense>
  );
}
