export default function HomePage() {
  const modules = [
    { href: '/extract', icon: '🔗', title: '链接文案提取', desc: '输入链接自动提取结构化文案，支持多平台' },
    { href: '/materials', icon: '📦', title: '素材库', desc: '视频素材爬取、分类、预览管理' },
    { href: '/materials-library', icon: '📚', title: '素材管理', desc: '素材审核、标签管理、批量操作' },
    { href: '/polish', icon: '✨', title: '润色合规去重', desc: '多风格改写、违禁词检测、去重防抄袭' },
    { href: '/tts', icon: '🎤', title: '声音克隆调参', desc: '音色克隆、语速/情绪/音高调节' },
    { href: '/avatar', icon: '👤', title: '数字人形象', desc: '生成/编辑数字人形象，视频驱动' },
    { href: '/editor', icon: '🎬', title: '视频剪辑字幕', desc: '混剪、字幕校准、音频混音' },
    { href: '/cover', icon: '🖼️', title: '封面标题标签', desc: '自动生成标题、封面、标签、话题' },
    { href: '/publish', icon: '🚀', title: '多平台发布', desc: '一键发布抖音/B站/快手/小红书/视频号' },
  ];

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">🎬 视频智能体</h1>
        <p className="text-gray-500 text-lg">一站式短视频自动化工作台</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <a key={m.href} href={m.href} className="card hover:shadow-md transition-shadow group">
            <div className="text-3xl mb-3">{m.icon}</div>
            <h2 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors">{m.title}</h2>
            <p className="text-sm text-gray-500">{m.desc}</p>
          </a>
        ))}
      </div>

      <div className="mt-12 card">
        <h2 className="text-lg font-semibold mb-4">📋 快速开始</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>复制视频/文章链接 → <a href="/extract" className="text-blue-600 hover:underline">文案提取</a></li>
          <li>选择风格 → <a href="/polish" className="text-blue-600 hover:underline">润色合规</a></li>
          <li>选择/克隆音色 → <a href="/tts" className="text-blue-600 hover:underline">语音合成</a></li>
          <li>配置数字人 → <a href="/avatar" className="text-blue-600 hover:underline">形象生成</a></li>
          <li>剪辑+字幕 → <a href="/editor" className="text-blue-600 hover:underline">视频编辑</a></li>
          <li>生成封面信息 → <a href="/cover" className="text-blue-600 hover:underline">封面标签</a></li>
          <li>一键发布 → <a href="/publish" className="text-blue-600 hover:underline">多平台发布</a></li>
        </ol>
      </div>
    </div>
  );
}
