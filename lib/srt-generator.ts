export function generateSrt(text: string, durationSec: number): string {
  const sentences = text.split(/(?<=[\u3002\uff01\uff1f.!?\n])/).filter(s => s.trim());
  if (sentences.length === 0) return '';
  const avgDuration = durationSec / sentences.length;
  let srt = '';
  sentences.forEach((s, i) => {
    const start = i * avgDuration;
    const end = (i + 1) * avgDuration;
    srt += (i + 1) + '\n' + formatTime(start) + ' --> ' + formatTime(end) + '\n' + s.trim() + '\n\n';
  });
  return srt;
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + ',' + String(ms).padStart(3,'0');
}
