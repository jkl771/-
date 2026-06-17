const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 找到 return 语句
const returnIdx = content.indexOf('return (', content.indexOf('export default function TTSPage'));
const beforeReturn = content.substring(0, returnIdx);
const afterReturn = content.substring(returnIdx);

// 新的 JSX 结构
const newReturn = `return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">🎤 声音工作台</h1>
          <p className="text-sm text-gray-500 mt-2">声音克隆、语音合成、音色管理，支持多种 TTS 源</p>
        </header>

        {/* === 音源选择器（全宽） === */}
        <div className="flex gap-3">
          <button onClick={() => setTtsMode('edge')} className={'flex-1 p-4 rounded-2xl border-2 transition text-left ' + (ttsMode === 'edge' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🆓</span>
              <span className="font-bold text-sm text-gray-800">免费预设</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">免费</span>
            </div>
            <p className="text-xs text-gray-400">Edge TTS 预设音色，无需配置，完全免费</p>
          </button>
          <button onClick={() => setTtsMode('cosy-clone')} className={'flex-1 p-4 rounded-2xl border-2 transition text-left ' + (ttsMode === 'cosy-clone' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🧬</span>
              <span className="font-bold text-sm text-gray-800">克隆音色</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">克隆</span>
            </div>
            <p className="text-xs text-gray-400">阿里云 CosyVoice 克隆你的声音，需配置 DashScope Key</p>
          </button>
          <button onClick={() => setTtsMode('elevenlabs')} className={'flex-1 p-4 rounded-2xl border-2 transition text-left ' + (ttsMode === 'elevenlabs' ? 'border-violet-400 bg-violet-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300')}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🌍</span>
              <span className="font-bold text-sm text-gray-800">ElevenLabs</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">付费</span>
            </div>
            <p className="text-xs text-gray-400">海外顶级 TTS，需配置 ElevenLabs Key</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* === 左栏：根据音源模式显示不同内容 === */}
          {ttsMode === 'edge' && (
            <section className="lg:col-span-1 card space-y-4">
              <SectionTitle icon="🆓" title="Edge TTS 音色" extra={<Badge variant="success">免费</Badge>} />
              <p className="text-xs text-gray-500">免费预设音色，无需配置任何 Key，直接使用。</p>
              <div className="space-y-2">
                {edgeVoices.map((v) => (
                  <button key={v.key} onClick={() => setSelectedVoice(v.key)} className={'w-full p-3 rounded-xl border-2 text-left transition ' + (selectedVoice === v.key ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-800">{v.label}</span>
                      <span className="text-xs text-gray-400">{v.style}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{v.desc}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {ttsMode === 'cosy-clone' && (
            <section className="lg:col-span-1 card space-y-4">
              <SectionTitle icon="🧬" title="声音克隆" extra={<Badge variant="info">阿里云 CosyVoice</Badge>} />
              <p className="text-xs text-gray-500">上传一段清晰人声，AI 自动克隆音色并可用于合成。</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                <div className="font-semibold">💡 什么是 API Key？</div>
                <div>API Key 是阿里云的访问密钥，一个 Key 可用于：声音克隆 + 语音合成 + 数字人口型。</div>
                <div>👉 <a className="text-blue-600 underline" href="https://bailian.console.aliyun.com/cn-beijing?tab=globalset#/efm/api_key" target="_blank">点击这里获取 DashScope API Key</a></div>
                <div className="text-blue-500">获取后粘贴到下方「配置 Key」即可，系统会加密存储。</div>
              </div>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-violet-300 hover:bg-violet-50/40 transition text-xs text-gray-400">
                <span>{sampleFile ? sampleFile.name : '上传 10~30 秒清晰人声 WAV/MP3'}</span>
                <input type="file" accept=".wav,.mp3" className="hidden" onChange={(e) => setSampleFile(e.target.files?.[0] || null)} />
              </label>
              <button onClick={handleClone} disabled={!sampleFile || cloning} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition">
                {cloning ? '⏳ 克隆中...' : '🚀 开始克隆'}
              </button>
              {cloneError && <div className="text-xs text-red-500">{cloneError}</div>}
              {clonedVoices.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">已克隆音色</div>
                  {clonedVoices.map((v) => (
                    <div key={v.voiceId} className={'flex items-center justify-between p-2 rounded-lg text-xs transition ' + (selectedCloneId === v.voiceId ? 'bg-violet-50 border-2 border-violet-300' : 'bg-gray-50 border border-transparent')}>
                      {editingId === v.voiceId ? (
                        <div className="flex-1 flex gap-2">
                          <input className="border rounded px-2 py-1 text-xs flex-1" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename(v.voiceId)} autoFocus />
                          <button className="text-emerald-600 font-medium" onClick={() => handleRename(v.voiceId)}>保存</button>
                          <button className="text-gray-400" onClick={() => setEditingId(null)}>取消</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 cursor-pointer" onClick={() => { setSelectedCloneId(v.voiceId); setTtsMode('cosy-clone'); }}>
                            <div className="font-medium text-gray-800">{v.name}</div>
                            <div className="text-gray-400 mt-0.5">{v.voiceId.slice(0, 24)}...</div>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <button className="text-blue-600 hover:text-blue-700" onClick={() => { setEditingId(v.voiceId); setEditingName(v.name); }}>重命名</button>
                            <button className="text-red-400 hover:text-red-600" onClick={() => handleDelete(v.voiceId)}>删除</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {ttsMode === 'elevenlabs' && (
            <section className="lg:col-span-1 card space-y-4">
              <SectionTitle icon="🌍" title="ElevenLabs 音色" extra={<Badge variant="warning">付费</Badge>} />
              <p className="text-xs text-gray-500">海外顶级 TTS，需配置 ElevenLabs Key。</p>
              {!elKeyConfigured && <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">请先在右侧配置 ElevenLabs API Key</div>}
              <div className="space-y-2">
                {elVoices.map((v) => (
                  <button key={v.key} onClick={() => setSelectedElVoice(v.key)} className={'w-full p-3 rounded-xl border-2 text-left transition ' + (selectedElVoice === v.key ? 'border-violet-400 bg-violet-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
                    <div className="font-medium text-sm text-gray-800">{v.label}</div>
                    <div className="text-xs text-gray-400">{v.desc}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* === 右栏：文案与合成 === */}
          <section className="lg:col-span-2 card space-y-5">
            <SectionTitle icon="📝" title="文案与合成" />

            {/* 当前音色显示 */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400">当前音色</span>
                <div className="font-medium text-gray-800 mt-1">
                  {ttsMode === 'edge' && (edgeVoices.find((v) => v.key === selectedVoice)?.label || selectedVoice)}
                  {ttsMode === 'elevenlabs' && (selectedElVoice || '未选择')}
                  {ttsMode === 'cosy-clone' && (selectedCloneId ? getCloneVoiceName(selectedCloneId) : '未选择克隆音色')}
                </div>
              </div>
              {ttsMode === 'cosy-clone' && selectedCloneId && <Badge variant="success">已选中</Badge>}
            </div>

            {/* 文案输入 */}
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 min-h-[180px] resize-y" value={text} onChange={(e) => setText(e.target.value)} placeholder="在这里输入你想合成的文案..." />

            {/* 语音参数 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-2">语速 <span className="text-gray-400">{speed.toFixed(2)}x</span></div>
                <input type="range" min="0.6" max="1.6" step="0.05" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">音调 <span className="text-text-gray-400">{pitch}</span></div>
                <input type="range" min="-50" max="50" step="1" value={pitch} onChange={(e) => setPitch(parseInt(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">情绪</div>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs" value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                  {EMOTIONS.map((em) => (
                    <option key={em.key} value={em.key}>{em.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* BGM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-2">背景音乐（可选）</div>
                <div className="flex gap-2">
                  <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs" placeholder="输入关键词搜索 BGM" value={bgmQuery} onChange={(e) => setBgmQuery(e.target.value)} />
                  <button onClick={async () => { setBgmSearching(true); try { const r = await fetch('/api/bgm?source=builtin'); const d = await r.json(); if (d?.success) setBgmItems(d.data); } catch {} finally { setBgmSearching(false); } }} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs hover:bg-violet-600 transition whitespace-nowrap">{bgmSearching ? '...' : '搜索'}</button>
                </div>
                {bgmFile && <div className="text-xs text-emerald-600 mt-1">已选: {bgmFile.split('/').pop()} <button className="text-red-400 ml-2" onClick={() => setBgmFile('')}>清除</button></div>}
                <div className="mt-2 max-h-40 overflow-auto space-y-2">
                  {filterByQuery(bgmItems, bgmQuery).slice(0, 10).map((b) => (
                    <div key={b.id} className={'flex items-center justify-between p-2 rounded-lg text-xs transition ' + (bgmFile === b.url ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50 hover:bg-gray-100')}>
                      <button className="flex-1 text-left" onClick={() => setBgmFile(b.url)}>
                        <div className="font-medium text-gray-800">{b.name}</div>
                        <div className="text-gray-400">{b.category}{b.artist ? ' · ' + b.artist : ''}</div>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (previewBgm === b.url) { bgmAudioRef.current?.pause(); setPreviewBgm(null); } else { setPreviewBgm(b.url); setTimeout(() => bgmAudioRef.current?.play().catch(() => {}), 100); } }} className="text-xs text-violet-600 hover:text-violet-800 px-2 py-1 ml-2">{previewBgm === b.url ? '⏸' : '▶'}</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">BGM 音量 <span className="text-gray-400">{bgmVolume.toFixed(2)}</span></div>
                <input type="range" min="0" max="0.6" step="0.02" value={bgmVolume} onChange={(e) => setBgmVolume(parseFloat(e.target.value))} className="w-full" />
              </div>
            </div>

            {/* 生成按钮 */}
            <button onClick={handleSynthesize} disabled={synthesizing || !text.trim()} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-base font-bold transition shadow-lg shadow-blue-200">
              {synthesizing ? '⏳ 生成中...' : '🎵 生成音频'}
            </button>

            {/* 错误 */}
            {synthError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{synthError}</div>}

            {/* 降级提示 */}
            {synthResult?.autoSwitch && (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠️ {synthResult.autoNote || '音源不可用，已自动切换到可用音源'}
              </div>
            )}
            {synthResult?.autoNote && !synthResult.autoSwitch && (
              <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-xl p-3">
                ℹ️ {synthResult.autoNote}
              </div>
            )}

            {/* 生成结果 */}
            {synthResult && (
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Badge variant="success">✅ 生成成功</Badge>
                  <span className="text-xs text-gray-500">音源: {synthResult.providerUsed || ttsMode}</span>
                  {synthResult.duration ? <span className="text-xs text-gray-500">时长: {Math.round(synthResult.duration)}s</span> : null}
                </div>
                <audio ref={audioRef} controls className="w-full rounded-lg" src={synthResult.audioUrl} />
                <a className="text-xs text-blue-600 hover:underline" href={synthResult.audioUrl} download>下载音频</a>
              </div>
            )}

            {/* 探测区 */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => { if (showProbe) { setShowProbe(false); } else { setShowProbe(true); handleProbe(); } }} disabled={probing} className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition">
                  {probing ? '探测中...' : showProbe ? '收起探测' : '🔍 探测可用音源'}
                </button>
                {recommendedSource && <Badge variant="success">推荐: {recommendedSource}</Badge>}
              </div>
              {showProbe && probeResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {probeResults.map((r) => (
                    <div key={r.id} className={'p-3 rounded-xl border text-xs ' + (r.available ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50')}>
                      <div className="flex items-center justify-between">
                        <div className="r.font-medium text-gray-800">{r.label}</div>
                        <Badge variant={r.available ? 'success' : 'default'}>{r.available ? '可用' : '不可用'}</div>
                      </div>
                      {r.latencyMs ? <div className="text-gray-400 mt-1">{r.latencyMs}ms</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* API Key 配置区 */}
            <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-2">DashScope Key（阿里云）</div>
                <Badge variant={apiKeyConfigured ? 'success' : 'default'}>{apiKeyConfigured ? '已配置' : '新配置'}</Badge>
                {apiKeyConfigured && <p className="text-xs text-gray-400 mt-1 font-mono">{apiKeyMasked}</p>}
                {showApiKey ? (
                  <div className="space-y-2 mt-2">
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" type="password" placeholder="sk-..." value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl text-white text-xs font-medium bg-violet-500 hover:bg-violet-600 transition" onClick={handleSaveApiKey} disabled={apiKeyTesting}>{apiKeyTesting ? '...' : '保存'}</button>
                      <button className="py-2 px-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition" onClick={() => setShowApiKey(false)}>取消</button>
                    </div>
                    {apiKeyTestResult && <p className={'text-xs ' + (apiKeyTestResult.ok ? 'text-emerald-600' : 'text-red-600')}>{apiKeyTestResult.msg}</p>}
                  </div>
                ) : (
                  <button className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-2" onClick={() => setShowApiKey(true)}>{apiKeyConfigured ? '更换 Key' : '配置 Key'}</button>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-2">ElevenLabs Key</div>
                <Badge variant={elKeyConfigured ? 'success' : 'default'}>{elKeyConfigured ? '已配置' : '未配置'}</Badge>
                {elKeyConfigured && <p className="text-xs text-gray-400 mt-1 font-mono">{elKeyMasked}</p>}
                {showUsage ? (
                  <div className="space-y-2 mt-2">
                    <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300" type="password" placeholder="EL Key..." value={elKeyInput} onChange={(e) => setElKeyInput(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-xl text-white text-xs font-medium bg-violet-500 hover:bg-violet-600 transition" onClick={handleSaveElKey} disabled={elKeyTesting}>{elKeyTesting ? '...' : '保存'}</button>
                      <button className="py-2 px-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition" onClick={() => setShowUsage(false)}>取消</button>
                    </div>
                    {elKeyTestResult && <p className={'text-xs ' + (elKeyTestResult.ok ? 'text-emerald-600' : 'text-red-600')}>{elKeyTestResult.msg}</p>}
                  </div>
                ) : (
                  <button className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-2" onClick={() => setShowUsage(true)}>{elKeyConfigured ? '更换 Key' : '未配置'}</button>
                )}
              </div>
            </div>
          </section>
        </div>

        <footer className="text-center text-xs text-gray-300 pt-8 pb-2">
          {previewBgm && <audio ref={bgmAudioRef} src={previewBgm} onEnded={() => setPreviewBgm(null)} />}
          {'声音工作台 · 支持 Edge TTS / ElevenLabs / CosyVoice'}
        </footer>
      </div>
    </div>
  );`;

// 替换 return 语句
// 找到完整的 return 语句（从 return ( 到 );）
const returnStart = returnIdx;
let braceCount = 0;
let returnEnd = returnStart;
for (let i = returnStart; i < content.length; i++) {
  if (content[i] === '(') braceCount++;
  if (content[i] === ')') braceCount--;
  if (braceCount === 0) {
    returnEnd = i + 1;
    break;
  }
}

const oldReturn = content.substring(returnStart, returnEnd);
content = beforeReturn + newReturn + content.substring(returnEnd);

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Fixed layout');
