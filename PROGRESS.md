# PROGRESS.md

## 当前状态（2026-06-18 修订）
- /tts 声音工作台正常运行（已修复编译错误）
- **BGM 在线搜索已修复**：从 ccMixter 切换到 Audius API
- **前端 page.tsx 已修复**：解决了编码损坏 + JSX 语法错误导致的编译失败
- 克隆音色 → 合成音频链路已验证通过
- Edge TTS 合成正常

## 本轮修复

### 1. page.tsx 编译错误修复
- **问题**：
  1. 文件末尾有重复的损坏 return 代码块（`;eturn (`）导致语法错误
  2. 行 680 的 emoji 字符（⏸ ▶ ⬇）被损坏为 `鈴?` `鈻?` `猬?`，导致 SWC 解析失败
  3. 行 672 有 `setBgmFile('⏸')` 残留（应为 `setBgmFile('')`）
  4. 行 698 有多余的 `</div>` 标签
  5. 文件含 UTF-8 BOM，SWC 可能误读编码
- **解决**：
  1. 删除 `);eturn (` 之后的重复代码块
  2. 将 emoji 替换为 ASCII 安全字符
  3. 修复 `setBgmFile('')` 
  4. 删除多余 `</div>`
  5. 移除 UTF-8 BOM

### 2. 验证结果
- GET /tts → ✅ 200（之前 500）
- GET /api/bgm?source=audius&q=chill → ✅ 返回 2 首
- POST /api/tts (list_clone_voices) → ✅ 1 个克隆音色
- POST /api/tts (synthesize, edge) → ✅
- POST /api/tts (synthesize, cosyvoice) → ✅

## 功能状态总览

| 功能 | 状态 | 说明 |
|------|------|------|
| Edge TTS 合成 | ✅ | 9 个预设音色，支持情绪/语速/音调 |
| CosyVoice 合成 | ✅ | 需配置 DashScope Key |
| CosyVoice 克隆 | ✅ | 已有 1 个克隆音色 |
| ElevenLabs | ⚠️ | Key 401，需用户更新 |
| BGM 本地库 | ✅ | 8 个预设 BGM |
| BGM 在线搜索 | ✅ | Audius API，免费无需 Key |
| BGM 试听/选用 | ✅ | |
| BGM 上传 | ✅ | MP3/WAV/OGG |
| 音源探测 | ✅ | |
| 数字人口型 | ✅ | 阿里云 VideoRetalk |

## 关键文件
- app/tts/page.tsx：声音工作台前端（已修复）
- app/api/tts/route.ts：TTS API
- app/api/bgm/route.ts：BGM API（本地库 + Audius 在线搜索）
- services/tts-edge.ts：Edge TTS 服务
- services/tts-cosyvoice.ts：CosyVoice 服务
- data/voices.json：克隆音色存储

## 已知问题
- ElevenLabs Key 401，需用户更新
- page.tsx 中 emoji 已替换为 ASCII 字符（视觉体验稍降）

## 决策记录
- 2026-06-18: ccMixter → Audius API 切换（连接稳定、免费、无需 Key）
- 2026-06-18: page.tsx emoji 替换为 ASCII（SWC 编译器对特定 Unicode 字符有兼容问题）
