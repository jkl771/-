"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">😵</div>
          <h1 className="text-2xl font-bold text-gray-800">出错了</h1>
          <p className="text-gray-500">{error.message || '页面遇到了一个错误'}</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            重试
          </button>
          <a href="/" className="block text-blue-600 hover:underline text-sm">返回首页</a>
        </div>
      </body>
    </html>
  );
}
