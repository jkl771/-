import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '视频智能体',
  description: '一站式短视频自动化工作台',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <a href="/" className="text-xl font-bold text-blue-600">🎬 视频智能体</a>
          <div className="flex gap-1 text-sm flex-wrap">
            <a href="/materials" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-medium">📦 素材库</a>
            <a href="/scripts" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600 font-medium">📝 文案库</a>
            <a href="/materials-library" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">📚 素材管理</a>
            <a href="/extract" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">🔗 提取</a>
            <a href="/polish" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">✨ 润色</a>
            <a href="/tts" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">🎤 声音</a>
            <a href="/avatar" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">👤 数字人</a>
            <a href="/editor" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">🎬 剪辑</a>
            <a href="/cover" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">🖼️ 封面</a>
            <a href="/publish" className="px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-600">🚀 发布</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
