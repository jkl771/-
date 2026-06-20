'use client';

import { useState } from 'react';

interface PublishRecord {
  id: string;
  platform: string;
  title: string;
  status: string;
  scheduledAt?: string;
  createdAt: string;
  error?: string;
}

const PLATFORMS = [
  { id: 'douyin', name: '抖音' },
  { id: 'kuaishou', name: '快手' },
  { id: 'bilibili', name: 'B站' },
  { id: 'xiaohongshu', name: '小红书' },
  { id: 'shipinhao', name: '视频号' },
];

export default function PublishPage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [topics, setTopics] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<PublishRecord[]>([]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      setError('请至少选择一个平台');
      return;
    }
    if (!videoUrl.trim()) {
      setError('请输入视频链接');
      return;
    }
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const createRes = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          platforms: selectedPlatforms,
          videoUrl,
          coverUrl,
          title,
          description,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          topics: topics.split(',').map((t) => t.trim()).filter(Boolean),
          scheduledAt: scheduledAt || undefined,
        }),
      });
      if (!createRes.ok) throw new Error('创建发布任务失败: ' + createRes.status);
      const createData = await createRes.json();

      const execRes = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', taskId: createData.taskId || createData.id }),
      });
      if (!execRes.ok) throw new Error('执行发布失败: ' + execRes.status);
      const execData = await execRes.json();

      const newRecords: PublishRecord[] = (execData.results || [execData]).map((r: any, i: number) => ({
        id: r.id || String(Date.now()) + '-' + i,
        platform: r.platform || selectedPlatforms[i] || selectedPlatforms[0],
        title,
        status: r.status || 'pending',
        scheduledAt: scheduledAt || undefined,
        createdAt: new Date().toISOString(),
        error: r.error,
      }));
      setRecords((prev) => [...newRecords, ...prev]);
    } catch (err: any) {
      setError(err.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (record: PublishRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, status: 'retrying' } : r))
    );
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', platform: record.platform, videoUrl, coverUrl, title, description }),
      });
      if (!res.ok) throw new Error('重试失败: ' + res.status);
      const data = await res.json();
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, status: data.status || 'success', error: undefined } : r))
      );
    } catch (err: any) {
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? { ...r, status: 'failed', error: err.message } : r))
      );
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'badge-success';
      case 'failed': return 'badge-error';
      case 'retrying': return 'badge-warning';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">🚀 多平台发布</h1>

      <div className="card p-6 space-y-5 mb-6">
        <div>
          <label className="label">选择平台</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                className={selectedPlatforms.includes(p.id) ? 'btn-primary' : 'btn-secondary'}
                onClick={() => togglePlatform(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">视频链接</label>
          <input className="input-field w-full" placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </div>

        <div>
          <label className="label">封面链接</label>
          <input className="input-field w-full" placeholder="https://..." value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
        </div>

        <div>
          <label className="label">标题</label>
          <input className="input-field w-full" placeholder="输入发布标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="label">简介</label>
          <textarea className="input-field w-full h-24 resize-none" placeholder="输入简介..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">标签（逗号分隔）</label>
            <input className="input-field w-full" placeholder="标签1, 标签2" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div>
            <label className="label">话题（逗号分隔）</label>
            <input className="input-field w-full" placeholder="话题1, 话题2" value={topics} onChange={(e) => setTopics(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">定时发布</label>
          <input type="datetime-local" className="input-field w-full" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </div>

        <button className="btn-primary w-full" onClick={handlePublish} disabled={loading}>
          {loading ? '发布中...' : '立即发布'}
        </button>
      </div>

      {error && (
        <div className="card p-4 mb-4 border-l-4 border-red-500">
          <span className="badge-error">{error}</span>
        </div>
      )}

      {records.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">发布记录</h2>
          <div className="space-y-3">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{r.title}</span>
                    <span className={statusBadge(r.status)}>{r.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    平台: {PLATFORMS.find((p) => p.id === r.platform)?.name || r.platform}
                    {r.scheduledAt && ' | 定时: ' + r.scheduledAt}
                  </p>
                  {r.error && <p className="text-sm text-red-500 mt-1">{r.error}</p>}
                </div>
                {r.status === 'failed' && (
                  <button className="btn-secondary text-sm ml-4" onClick={() => handleRetry(r)}>重试</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
