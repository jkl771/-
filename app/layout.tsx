import type { Metadata } from 'next';
import NavLink from './components/NavLink';
import ThemeToggle from './components/ThemeToggle';
import ToastContainer from './components/Toast';
import './globals.css';
export const metadata: Metadata = {
  title: { default: '视频智能体', template: '%s - 视频智能体' },
  description: '一站式短视频自动化工作台',
  openGraph: {
    title: '视频智能体',
    description: '一站式短视频自动化工作台',
    siteName: '视频智能体',
    type: 'website',
    locale: 'zh_CN',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
          <a href="/" className="text-xl font-bold text-blue-600">🎬 视频智能体</a>
          <ThemeToggle />
          <div className="flex gap-1 text-sm flex-wrap">
            <NavLink href="/materials">📦 素材库</NavLink>
            <NavLink href="/scripts">📝 文案库</NavLink>
            <NavLink href="/materials-library">📚 素材管理</NavLink>
            <NavLink href="/extract">🔗 提取</NavLink>
            <NavLink href="/polish">✨ 润色</NavLink>
            <NavLink href="/tts">🎤 声音</NavLink>
            <NavLink href="/avatar">👤 数字人</NavLink>
            <NavLink href="/editor">🎬 剪辑</NavLink>
            <NavLink href="/cover">🖼️ 封面</NavLink>
            <NavLink href="/publish">🚀 发布</NavLink>
          </div>
        </nav>
        <ToastContainer />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}