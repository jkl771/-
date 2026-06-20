"use client";

import { Badge } from '@/app/components/Badge';

interface ProbeResult {
  id: string;
  label: string;
  available: boolean;
  latencyMs?: number;
}

export default function ProbePanel({
  showProbe,
  probeResults,
  probing,
  recommendedSource,
  onToggle,
}: {
  showProbe: boolean;
  probeResults: ProbeResult[];
  probing: boolean;
  recommendedSource: string | null;
  onToggle: () => void;
}) {
  return (
    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onToggle}
          disabled={probing}
          className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900 transition"
        >
          {probing ? '探测中...' : showProbe ? '收起探测' : '🔍 探测可用音源'}
        </button>
        {recommendedSource && <Badge variant="success">推荐: {recommendedSource}</Badge>}
      </div>
      {showProbe && probeResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {probeResults.map((r) => (
            <div
              key={r.id}
              className={
                'p-3 rounded-xl border text-xs ' +
                (r.available ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50')
              }
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-800 dark:text-gray-200">{r.label}</div>
                <Badge variant={r.available ? 'success' : 'default'}>
                  {r.available ? '可用' : '不可用'}
                </Badge>
              </div>
              {r.latencyMs ? (
                <div className="text-gray-400 dark:text-gray-500 mt-1">{r.latencyMs}ms</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
