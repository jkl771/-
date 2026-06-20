'use client';
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MaterialsInner() {
  const searchParams = useSearchParams();
  const viewId = searchParams.get("id");
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [folderMsg, setFolderMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!viewId) {
      fetch("/api/materials").then((r) => r.json()).then((d) => {
        if (d.success) setList(d.data);
        setLoading(false);
      });
    }
  }, [viewId]);

  useEffect(() => {
    if (viewId) {
      fetch(`/api/materials?id=${viewId}`).then((r) => r.json()).then((d) => {
        if (d.success) setDetail(d.data);
        setLoading(false);
      });
    }
  }, [viewId]);

  const handleSearch = () => {
    setLoading(true);
    fetch(`/api/materials?q=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setList(d.data);
        setLoading(false);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该素材？删除后对应的文案也会一并删除，且不可恢复。")) return;
    const resp = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    const data = await resp.json();
    if (data.success) {
      setList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const openFolder = async (id: string) => {
    setFolderMsg("");
    try {
      const resp = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open_folder", id }),
      });
      const data = await resp.json();
      if (data.success) {
        setFolderMsg("✅ 已打开文件夹");
        setTimeout(() => setFolderMsg(""), 3000);
      } else {
        setFolderMsg("❌ " + data.error);
      }
    } catch (e: any) {
      setFolderMsg("❌ " + e.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDuration = (sec: number) => {
    if (!sec) return "-";
    return `${Math.floor(sec / 60)}分${Math.floor(sec % 60)}秒`;
  };

  if (error) return <div className='text-center py-20 text-red-400'>{error} <button className='text-blue-600 ml-2' onClick={() => { setError(''); window.location.reload(); }}>重试</button></div>;
  if (loading) return <div className="text-center py-20 text-gray-400 dark:text-gray-500">加载中...</div>;

  if (viewId && detail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <a href="/materials" className="text-blue-600 hover:underline text-sm">← 返回素材库</a>
          <h1 className="text-2xl font-bold">📦 素材详情</h1>
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-semibold">{detail.title}</h2>
            <div className="flex gap-2">
              <button onClick={() => openFolder(detail.id)} className="btn-secondary text-sm">📂 打开本地文件夹</button>
              <a href={`/scripts?id=${detail.id}`} className="btn-primary text-sm">📝 查看文案</a>
              <button onClick={() => handleDelete(detail.id)} className="btn-secondary text-sm text-red-600 border-red-300 hover:bg-red-50 dark:bg-red-900/30">🗑️ 删除</button>
            </div>
          </div>
          {folderMsg && <p className="text-sm text-green-600 mb-3">{folderMsg}</p>}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">作者</span>
              <span className="font-medium text-sm">{detail.author || "-"}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">平台</span>
              <span className="font-medium text-sm">{detail.platform || "-"}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">时长</span>
              <span className="font-medium text-sm">{formatDuration(detail.duration)}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">创建时间</span>
              <span className="font-medium text-sm">{detail.created_at ? new Date(detail.created_at).toLocaleString("zh-CN") : "-"}</span>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 block">链接</span>
              <a href={detail.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate block">打开原链接</a>
            </div>
          </div>
        </div>

        {detail.description && (
          <div className="card">
            <h3 className="font-semibold mb-2">📝 视频描述</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{detail.description}</p>
          </div>
        )}

        {detail.tags?.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-2">🏷️ 标签</h3>
            <div className="flex flex-wrap gap-2">
              {detail.tags.map((tag: string, i: number) => (
                <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full px-3 py-1 text-xs">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {detail.has_video && (
          <div className="card">
            <h3 className="font-semibold mb-2">🎬 视频</h3>
            <video controls className="w-full rounded-lg" src={`/api/materials/file?id=${viewId}&type=video`} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">大小：{formatSize(detail.video_size)}</p>
          </div>
        )}

        {detail.has_audio && (
          <div className="card">
            <h3 className="font-semibold mb-2">🎵 音频</h3>
            <audio controls className="w-full" src={`/api/materials/file?id=${viewId}&type=audio`} />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">大小：{formatSize(detail.audio_size)}</p>
              <button onClick={() => openFolder(detail.id)} className="text-xs text-blue-600 hover:underline">📂 打开文件</button>
            </div>
          </div>
        )}

        {!detail.has_video && !detail.has_audio && (
          <p className="text-gray-400 dark:text-gray-500 text-sm card">音频/视频文件未下载</p>
        )}

        <div className="card">
          <h3 className="font-semibold mb-2">🔗 原始链接</h3>
          <a href={detail.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">{detail.url}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📦 素材库</h1>
        <a href="/extract" className="btn-primary text-sm">+ 提取新素材</a>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="搜索素材标题、作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />
        <button onClick={handleSearch} className="btn-primary text-sm">🔍 搜索</button>
      </div>

      {list.length === 0 ? (
        <div className="card text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>素材库为空</p>
          <a href="/extract" className="text-blue-600 hover:underline text-sm mt-2 inline-block">去提取第一个视频 →</a>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item: any) => (
            <div key={item.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <a href={`/materials?id=${item.id}`} className="flex-1 group block">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-medium">{item.platform || "未知"}</span>
                    <h3 className="font-semibold group-hover:text-blue-600 transition-colors">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.author || "未知作者"}</p>
                  <div className="flex gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <span>⏱ {formatDuration(item.duration)}</span>
                    {item.has_video && <span>🎬 {formatSize(item.video_size)}</span>}
                    {item.has_audio && <span>🎵 {formatSize(item.audio_size)}</span>}
                    {item.has_transcript && <span>📝 已转写</span>}
                  </div>
                </a>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className="flex gap-1">
                    {item.has_video && <span className="badge-success">视频</span>}
                    {item.has_audio && <span className="badge-success">音频</span>}
                  </div>
                  <button onClick={() => openFolder(item.id)} className="text-xs text-blue-600 hover:underline">📂 打开文件夹</button>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-red-600 hover:underline">🗑️ 删除</button>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString("zh-CN") : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400 dark:text-gray-500">加载中...</div>}>
      <MaterialsInner />
    </Suspense>
  );
}