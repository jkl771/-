# 🎬 视频智能体

一站式短视频自动化工作台，支持从文案提取到多平台发布的完整工作流。

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 🔗 链接文案提取 | `/extract` | 输入 URL 或粘贴文本，自动提取结构化文案 |
| ✨ 润色合规去重 | `/polish` | 多风格改写、违禁词检测、去重防抄袭 |
| 🎤 声音克隆调参 | `/tts` | 音色克隆、语速/情绪/音高/停顿调节 |
| 👤 数字人形象 | `/avatar` | 生成/编辑数字人形象，视频驱动 |
| 🎬 视频剪辑字幕 | `/editor` | 混剪、字幕校准、人声/BGM 音量控制 |
| 🖼️ 封面标题标签 | `/cover` | 自动生成标题、封面、标签、话题 |
| 🚀 多平台发布 | `/publish` | 一键发布抖音/B站/快手/小红书/视频号 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 API Key

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 技术栈

- **前端**: Next.js 15 + React 19 + Tailwind CSS
- **后端**: Next.js API Routes
- **AI**: OpenAI API (LLM + TTS)，可替换为任意兼容接口
- **视频**: FFmpeg (需本地安装)
- **数字人**: D-ID API (可替换)
- **存储**: 内存存储 (开发期)，可替换为数据库

## 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| `LLM_API_KEY` | LLM API 密钥 (润色/标题生成) | ✅ |
| `LLM_BASE_URL` | LLM API 地址 | 否 |
| `TTS_API_KEY` | TTS API 密钥 (语音合成) | MVP-2 |
| `AVATAR_API_KEY` | 数字人 API 密钥 | MVP-2 |
| `FFMPEG_PATH` | FFmpeg 路径 | 视频渲染时 |

## 项目结构

```
├── app/
│   ├── api/              # 7 个 API 路由
│   │   ├── extract/      # 文案提取
│   │   ├── polish/       # 润色合规
│   │   ├── tts/          # 语音合成
│   │   ├── avatar/       # 数字人
│   │   ├── video/        # 视频剪辑
│   │   ├── cover/        # 封面标签
│   │   └── publish/      # 多平台发布
│   ├── extract/          # 文案提取页面
│   ├── polish/           # 润色页面
│   ├── tts/              # 声音页面
│   ├── avatar/           # 数字人页面
│   ├── editor/           # 剪辑页面
│   ├── cover/            # 封面页面
│   └── publish/          # 发布页面
├── services/             # 7 个业务服务层
├── lib/                  # 工具库 (类型/工具/LLM/存储)
├── config/               # 配置
└── output/               # 输出文件
```

## MVP 路线

- **MVP-1** ✅ 文案提取 + 润色合规 + 字幕剪辑 + 封面标题
- **MVP-2** 声音克隆/调参 + 数字人基础形象 (需配置 TTS/Avatar API)
- **MVP-3** 多平台发布自动化队列 (需各平台 OAuth 凭证)

## 注意事项

- 文案提取依赖目标 URL 可公开访问
- 润色和标题生成需要 LLM API Key
- 视频渲染需要本地安装 FFmpeg
- 多平台发布需要各平台开放平台的开发者凭证
- 当前存储为内存模式，重启后数据丢失
