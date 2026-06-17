# PROGRESS.md

## 当前状态（2026-06-18 最新）
- /tts 声音工作台正常运行
- 5 种 TTS 音源：Edge TTS / CosyVoice / ElevenLabs / Fish Audio / MiniMax
- 音频后处理：淡入淡出 + loudnorm 音量标准化
- SRT 字幕自动生成
- 试听历史（最近 5 条）

## 本轮新增功能

### 1. Fish Audio 接入
- 内置默认 Key，无需配置即可使用
- 支持声音克隆和语音合成
- 国内直连（无需代理）

### 2. MiniMax 接入
- 10 种预设音色（男女主持、有声书等）
- 需配置 API Key

### 3. 音频后处理（ffmpeg）
- 淡入 0.5s + 淡出 0.8s，避免突兀截断
- loudnorm 标准化到 -16 LUFS，不同音色音量一致
- 所有音源统一处理

### 4. SRT 字幕生成
- 自动按中文标点分句
- 均匀分配时间段
- 生成 .srt 文件，下载链接随音频一起返回

### 5. 前端增强
- 5 种音源选择按钮
- 句间停顿滑块（0-2000ms）
- 试听历史（最近 5 条，可回听对比）
- SRT 字幕下载

## 功能状态总览

| 功能 | 状态 | 说明 |
|------|------|------|
| Edge TTS | ✅ | 免费，9 预设音色 |
| CosyVoice | ✅ | 阿里云，需 DashScope Key |
| ElevenLabs | ⚠️ | Key 401，需用户更新 |
| Fish Audio | ✅ | 内置 Key，国产高音质 |
| MiniMax | ✅ | 需配置 Key |
| 声音克隆 | ✅ | CosyVoice + Fish Audio |
| BGM 搜索 | ✅ | Audius API + 本地库 |
| 音频后处理 | ✅ | 淡入淡出 + loudnorm |
| SRT 字幕 | ✅ | 自动分句生成 |
| 试听历史 | ✅ | 最近 5 条 |
| 句间停顿 | ✅ | 0-2000ms 可调 |

## 关键文件
- app/tts/page.tsx：前端
- app/api/tts/route.ts：TTS API（含后处理 + SRT）
- lib/api-keys.ts：Key 管理
- lib/srt-generator.ts：字幕生成
- services/tts-fish.ts：Fish Audio
- services/tts-minimax.ts：MiniMax
- services/tts-edge.ts：Edge TTS
- services/tts-cosyvoice.ts：CosyVoice

## 已知问题
- Fish Audio fetch failed（可能网络问题，内置 Key 可能过期）
- ElevenLabs Key 401
