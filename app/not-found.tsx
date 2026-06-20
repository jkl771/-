export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-3xl font-bold text-gray-800">404</h1>
        <p className="text-gray-500">页面不存在或已被移除</p>
        <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
          返回首页
        </a>
      </div>
    </div>
  );
}
