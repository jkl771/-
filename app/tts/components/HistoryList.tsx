"use client";

import { Badge } from '@/app/components/Badge';

interface HistoryItem {
  audioUrl: string;
  text: string;
  provider: string;
  time: string;
}

export default function HistoryList({ history }: { history: HistoryItem[] }) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">试听历史</div>
      {history.map((h, i) => (
        <div
          key={i}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-2 border border-gray-100 dark:border-slate-700"
        >
          <audio controls className="flex-1 h-8" src={h.audioUrl} />
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
            {h.text}
          </span>
          <Badge>{h.provider}</Badge>
          <span className="text-xs text-gray-300 dark:text-gray-600">{h.time}</span>
        </div>
      ))}
    </div>
  );
}
