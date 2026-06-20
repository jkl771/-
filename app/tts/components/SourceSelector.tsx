"use client";

import { Badge } from '@/app/components/Badge';

type TtsMode = 'edge' | 'cosy-clone' | 'elevenlabs' | 'fish' | 'minimax';

const sources: Array<{ mode: TtsMode; icon: string; label: string; badge: string; badgeVariant: 'success' | 'info'; desc: string }> = [
  { mode: 'edge', icon: '\ud83c\udfef', label: '免费预设', badge: '免费', badgeVariant: 'success', desc: 'Edge TTS 预设音色，无需配置，完全免费' },
  { mode: 'cosy-clone', icon: '\ud83e\uddec', label: '克隆音色', badge: '克隆', badgeVariant: 'info', desc: '阿里云 CosyVoice 克隆你的声音，需配置 DashScope Key' },
  { mode: 'elevenlabs', icon: '\ud83c\udf0d', label: 'ElevenLabs', badge: '付费', badgeVariant: 'info', desc: '海外顶级 TTS，需配置 ElevenLabs Key' },
  { mode: 'fish', icon: '\ud83d\udc1f', label: 'Fish Audio', badge: '付费', badgeVariant: 'info', desc: '国产高音质，支持声音克隆' },
  { mode: 'minimax', icon: '\ud83d\udd0a', label: 'MiniMax', badge: '付费', badgeVariant: 'info', desc: '海螺语音，多风格预设' },
];

export default function SourceSelector({
  ttsMode,
  setTtsMode,
}: {
  ttsMode: TtsMode;
  setTtsMode: (m: TtsMode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {sources.map((s) => (
        <button
          key={s.mode}
          onClick={() => setTtsMode(s.mode)}
          className={
            'flex-1 min-w-[140px] p-3 sm:p-4 rounded-2xl border-2 transition text-left ' +
            (ttsMode === s.mode
              ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 shadow-md'
              : 'border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-gray-300')
          }
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{s.icon}</span>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{s.label}</span>
            <Badge variant={s.badgeVariant}>{s.badge}</Badge>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{s.desc}</p>
        </button>
      ))}
    </div>
  );
}
