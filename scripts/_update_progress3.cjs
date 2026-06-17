const fs=require('fs');
const p='C:/Users/HYH/Documents/视频智能体/PROGRESS.md';
const now=new Date().toISOString();
const content=`# PROGRESS.md - 视频智能体项目进展

## 当前状态
- 声音工作台 UI 已重写，中文显示正常
- 内置 BGM 和本地音乐库功能正常
- **在线搜索已改为页面内直接搜索+试听+入库**（不再跳转外部页面）
- ccMixter 搜索 1.7s 出结果，试听直接浏览器流式播放

## 本轮完成的工作

### 1. 在线搜索 Tab 完全重写 ✅
- 之前：跳转 ccMixter 外部链接，需手动复制 URL
- 现在：页面内搜索框 + 快捷标签 + 结果列表 + 试听 + 一键入库
- 搜索 API: \`GET /api/bgm?source=ccmixter&q=happy&limit=20\`
- 试听：直接用浏览器 \`<audio>\` 流式播放远程 MP3 URL（不需要先下载）
- 入库：点击"⬇ 入库"异步下载到 \`public/bgm/library/\`

### 2. 新增前端状态和函数
- \`onlineQuery\` / \`onlineResults\` / \`onlineLoading\` / \`onlineError\`
- \`searchOnline(q)\` - 调 API 搜索 ccMixter
- \`previewOnline(item)\` - 浏览器直接播放远程 URL
- \`importToLibrary(item)\` - 异步入库
- \`downloadingId\` / \`downloadedIds\` - 入库状态追踪

### 3. BGM API 修复
- 搜索：独立脚本 \`scripts/search_ccmixter.py\`（1.7s 出结果）
- 下载：独立脚本 \`scripts/download_ccmixter.py\`（异步 spawn）
- POST \`/api/bgm\` 对 ccMixter 链接立即返回 \`{status:'downloading'}\`

## 关键文件

| 文件 | 用途 |
|------|------|
| \`app/tts/page.tsx\` | 声音工作台前端（含在线搜索+试听+入库） |
| \`app/api/bgm/route.ts\` | BGM API（GET 搜索/列表，POST 下载入库） |
| \`scripts/search_ccmixter.py\` | ccMixter 搜索脚本 |
| \`scripts/download_ccmixter.py\` | ccMixter 下载脚本 |

## 下一步
1. 浏览器端到端验证：搜索 → 结果列表 → 试听 → 入库 → 音乐库可见
2. 优化 ccMixter 下载速度（37KB/s 太慢，考虑换源或代理）
3. 增加更多免费 BGM 来源（Jamendo/Pixabay 需要 API Key）

## 决策记录
1. 在线试听直接用浏览器流式播放远程 URL，不需要先下载
2. ccMixter 搜索快（1.7s）但下载慢（37KB/s），入库改为异步
3. 不再跳转外部页面，所有操作在页面内完成
4. 时间戳：${now}
`;
fs.writeFileSync(p,content,'utf8');
console.log('updated-progress3');