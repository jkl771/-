'use client';
import { useState } from 'react';
export default function EditorPage() {
  const [projectName, setProjectName] = useState('我的视频项目');
  const [project, setProject] = useState<any>(null);
  const [subtitleText, setSubtitleText] = useState('');
  const [duration, setDuration] = useState(60);
  const [audioMix, setAudioMix] = useState({ voiceVolume: 1.0, bgmVolume: 0.3, bgmUrl: '' });
  const [calibrateOffset, setCalibrateOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const api = async (action: string, body: any = {}) => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await resp.json();
      if (data.success) {
        setProject(data.data);
        return data.data;
      } else {
        setError(data.error);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">🎬 视频剪辑与字幕</h1>
          <p className="text-sm text-gray-500 mt-2">创建工程、自动生成字幕、混音设置、渲染导出</p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 工程管理 */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-800">📁 工程管理</h2>
            <label className="text-xs text-gray-500">项目名称</label>
            <input className="input-field" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            <button onClick={() => api('create', { name: projectName })} className="btn-primary w-full" disabled={loading}>
              {loading ? '创建中...' : '创建新工程'}
            </button>
            {project && (
              <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-gray-800">当前工程：{project.name}</p>
                <p className="text-gray-600">状态：<span className="badge-success">{project.status}</span></p>
                <p className="text-gray-600">轨道：{project.tracks?.length || 0} 条</p>
                <p className="text-gray-600">字幕：{project.subtitles?.length || 0} 条</p>
              </div>
            )}
          </div>
          {/* 字幕设置 */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-800">📝 字幕设置</h2>
            <label className="text-xs text-gray-500">文案文本（自动生成字幕）</label>
            <textarea
              className="input-field h-24"
              placeholder="粘贴文案，自动按句切分生成字幕..."
              value={subtitleText}
              onChange={(e) => setSubtitleText(e.target.value)}
            />
            <label className="text-xs text-gray-500">总时长（秒）</label>
            <input type="number" className="input-field" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
            <button
              onClick={() => api('auto_subtitles', { projectId: project?.id, text: subtitleText, totalDuration: duration })}
              disabled={!project || !subtitleText || loading}
              className="btn-primary w-full"
            >
              自动生成字幕
            </button>
            <div className="border-t pt-3 mt-3 space-y-2">
              <label className="text-xs text-gray-500">校准偏移（秒，正=延后，负=提前）</label>
              <div className="flex gap-2">
                <input type="number" step="0.1" className="input-field flex-1" value={calibrateOffset} onChange={(e) => setCalibrateOffset(parseFloat(e.target.value))} />
                <button
                  onClick={() => api('calibrate', { projectId: project?.id, offset: calibrateOffset })}
                  disabled={!project || loading}
                  className="btn-secondary whitespace-nowrap"
                >
                  校准
                </button>
              </div>
            </div>
            <button
              onClick={() => api('export_srt', { projectId: project?.id })}
              disabled={!project || loading}
              className="btn-secondary w-full"
            >
              导出 SRT 字幕
            </button>
          </div>
          {/* 音频混音 */}
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-800">🔊 音频混音</h2>
            <div>
              <label className="text-xs text-gray-500">人声音量 ({audioMix.voiceVolume.toFixed(1)})</label>
              <input type="range" min="0" max="2" step="0.1" className="w-full mt-1"
                value={audioMix.voiceVolume} onChange={(e) => setAudioMix({ ...audioMix, voiceVolume: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">BGM 音量 ({audioMix.bgmVolume.toFixed(2)})</label>
              <input type="range" min="0" max="1" step="0.05" className="w-full mt-1"
                value={audioMix.bgmVolume} onChange={(e) => setAudioMix({ ...audioMix, bgmVolume: parseFloat(e.target.value) })} />
            </div>
            <label className="text-xs text-gray-500">BGM 链接</label>
            <input className="input-field" placeholder="https://..." value={audioMix.bgmUrl} onChange={(e) => setAudioMix({ ...audioMix, bgmUrl: e.target.value })} />
            <button
              onClick={() => api('audio_mix', { projectId: project?.id, mix: audioMix })}
              disabled={!project || loading}
              className="btn-primary w-full"
            >
              应用混音设置
            </button>
            <button
              onClick={() => api('render', { projectId: project?.id })}
              disabled={!project || project?.tracks?.length === 0 || loading}
              className="btn-primary w-full text-lg py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              🎬 渲染视频
            </button>
          </div>
        </div>
        {error && (
          <div className="card border-l-4 border-red-500 p-4">
            <span className="text-sm text-red-600">❌ {error}</span>
          </div>
        )}
        {/* 字幕预览 */}
        {project?.subtitles?.length > 0 && (
          <div className="card space-y-4">
            <h2 className="text-lg font-bold text-gray-800">📋 字幕列表（{project.subtitles.length} 条）</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-gray-500">#</th>
                    <th className="text-left p-2 text-gray-500">开始</th>
                    <th className="text-left p-2 text-gray-500">结束</th>
                    <th className="text-left p-2 text-gray-500">文本</th>
                  </tr>
                </thead>
                <tbody>
                  {project.subtitles.map((s: any, i: number) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-gray-400">{i + 1}</td>
                      <td className="p-2 font-mono text-gray-600">{s.startTime?.toFixed(1)}s</td>
                      <td className="p-2 font-mono text-gray-600">{s.endTime?.toFixed(1)}s</td>
                      <td className="p-2">{s.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <footer className="text-center text-xs text-gray-400 pb-6">视频剪辑工作台 · 字幕生成 · 混音设置 · 渲染导出</footer>
      </div>
    </div>
  );
}