# PROGRESS.md

## 当前状态（2026-06-21）
- TTS 声音工作台正常运行
- 5 种 TTS 音源：Edge TTS / CosyVoice / ElevenLabs / Fish Audio / MiniMax
- 音频后处理：淡入淡出 + loudnorm 音量标准化
- SRT 字幕自动生成
- 试听历史（最近 15 条）

## 本轮修改（2026-06-21）— 深色模式支持

### 新增
- app/globals.css: 追加 `.dark {}` 深色模式样式（背景、卡片、按钮、输入框、标签、滑块）
- app/components/ThemeToggle.tsx: 客户端主题切换组件（localStorage 持久化 + 系统偏好检测）

### 修改
- app/layout.tsx: 导入 ThemeToggle、添加 suppressHydrationWarning、nav 中插入切换按钮
- 11 个 page.tsx + output/tmp/page.tsx: 批量添加 385 个 dark: 类

### 方法
- globals.css / ThemeToggle.tsx / layout.tsx: PowerShell 直接写入
- page.tsx 批量替换: Python 脚本遍历 className 属性，智能判断上下文避免重复添加

## 功能状态总览

| 功能 | 状态 | 说明 |
|------|------|------|
| Edge TTS | OK | 免费，17 预设音色 |
| CosyVoice | OK | 阿里云，需 DashScope Key |
| ElevenLabs | 警告 | Key 401，需用户更新 |
| Fish Audio | 警告 | 内置 Key 不可达，需更新 |
| MiniMax | OK | 需配置 Key |
| 声音克隆 | OK | CosyVoice + Fish Audio |
| BGM 搜索 | OK | Audius API + 本地库 |
| 音频后处理 | OK | 淡入淡出 + loudnorm |
| SRT 字幕 | OK | 自动分句生成 |
| 试听历史 | OK | 最近 15 条 |
| 句间停顿 | OK | 0-2000ms 可调 |
| 数字人 | OK | 阿里云 VideoRetalk |
| 文案润色 | OK | 多风格改写 |
| 素材库 | OK | 搜索+管理 |
| 文案提取 | OK | 链接提取 |
| 深色模式 | OK | 全局主题切换 + 所有页面 dark: 类 |

## 已知问题
- Fish Audio API 不可达（fetch failed）
- ElevenLabs Key 401

## 关键文件
- app/globals.css: 全局样式 + 深色模式
- app/components/ThemeToggle.tsx: 主题切换组件
- app/layout.tsx: 根布局
- app/tts/page.tsx: 前端
- app/api/tts/route.ts: TTS API
- lib/api-keys.ts: Key 管理
- lib/srt-generator.ts: 字幕生成
- services/tts-*.ts: 各音源服务
- app/api/avatar/route.ts: 数字人 API

## 决策记录
- 2026-06-21: 深色模式方案选择 class 策略（.dark 切换在 html 标签），通过 Tailwind dark: 前缀 + globals.css 组件覆盖双管齐下
- 2026-06-21: Theme 使用 localStorage 持久化，首次访问跟随系统 prefers-color-scheme