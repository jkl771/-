# PROGRESS.md

## 当前状态（2026-06-20）
- /tts 声音工作台正常运行
- 5 种 TTS 音源：Edge TTS / CosyVoice / ElevenLabs / Fish Audio / MiniMax
- 音频后处理：淡入淡出 + loudnorm 音量标准化
- SRT 字幕自动生成
- 试听历史（最近 5 条）

## 本轮修复（2026-06-20）

### Bug 修复
- avatar/route.ts: 添加 fsSync import，修复数字人页面崩溃
- page.tsx: 添加 handleRename/handleDelete 函数，克隆音色重命名/删除可用
- page.tsx: 修复 bgmAudioRef/previewBgm 类型，BGM 试听播放器工作
- route.ts: 修复 edgeErr 类型为 any
- PROGRESS.md: 修复 UTF-8 乱码

## 功能状态总览

| 功能 | 状态 | 说明 |
|------|------|------|
| Edge TTS | OK | 免费，9 预设音色 |
| CosyVoice | OK | 阿里云，需 DashScope Key |
| ElevenLabs | 警告 | Key 401，需用户更新 |
| Fish Audio | 警告 | 内置 Key 不可达，需更新 |
| MiniMax | OK | 需配置 Key |
| 声音克隆 | OK | CosyVoice + Fish Audio |
| BGM 搜索 | OK | Audius API + 本地库 |
| 音频后处理 | OK | 淡入淡出 + loudnorm |
| SRT 字幕 | OK | 自动分句生成 |
| 试听历史 | OK | 最近 5 条 |
| 句间停顿 | OK | 0-2000ms 可调 |
| 数字人 | OK | 阿里云 VideoRetalk |
| 文案润色 | OK | 多风格改写 |
| 素材库 | OK | 爬取+管理 |
| 文案提取 | OK | 链接提取 |

## 已知问题
- Fish Audio API 不可达（fetch failed）
- ElevenLabs Key 401

## 关键文件
- app/tts/page.tsx: 前端
- app/api/tts/route.ts: TTS API
- lib/api-keys.ts: Key 管理
- lib/srt-generator.ts: 字幕生成
- services/tts-*.ts: 各音源服务
- app/api/avatar/route.ts: 数字人 API
