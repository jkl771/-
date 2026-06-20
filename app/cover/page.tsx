'use client';

import { useState } from 'react';

interface CoverResult {
  titles: string[];
  tags: string[];
  topics: string[];
  description: string;
}

export default function CoverPage() {
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState('douyin');
  const [style, setStyle] = useState('eye-catching');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CoverResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('请输入文案内容');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, platform, style, count: 5 }),
      });
      if (!res.ok) throw new Error('请求失败: ' + res.status);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || '生成失败');
      }
    } catch (err: any) {
      setError(err.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(content);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">🎨 封面标题与标签</h1>

      <div className="card p-6 space-y-5 mb-6">
        <div>
          <label className="label">文案内容</label>
          <textarea
            className="input-field w-full h-32 resize-none"
            placeholder="输入视频文案或内容简介..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">平台</label>
            <select className="input-field w-full" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="douyin">抖音</option>
              <option value="kuaishou">快手</option>
              <option value="bilibili">B站</option>
              <option value="xiaohongshu">小红书</option>
              <option value="shipinhao">视频号</option>
            </select>
          </div>
          <div>
            <label className="label">风格</label>
            <select className="input-field w-full" value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="eye-catching">吸引眼球</option>
              <option value="professional">专业</option>
              <option value="creative">创意</option>
              <option value="concise">简洁</option>
            </select>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...' : '生成标题与标签'}
        </button>
      </div>

      {error && (
        <div className="card p-4 mb-4 border-l-4 border-red-500">
          <span className="badge-error">{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">标题候选</h2>
            <div className="space-y-2">
              {result.titles.map((t, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-slate-900 dark:bg-gray-800 rounded-lg p-3">
                  <span className="flex-1 mr-3">{t}</span>
                  <button className="btn-secondary text-sm" onClick={() => handleCopy(t)}>
                    {copied === t ? '已复制 ✓' : '复制'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">标签</h2>
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, i) => (
                <span key={i} className="badge-success cursor-pointer" onClick={() => handleCopy(tag)}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-3">话题</h2>
            <div className="flex flex-wrap gap-2">
              {result.topics.map((topic, i) => (
                <span key={i} className="badge-warning cursor-pointer" onClick={() => handleCopy(topic)}>
                  #{topic}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">简介</h2>
              <button className="btn-secondary text-sm" onClick={() => handleCopy(result.description)}>复制</button>
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
