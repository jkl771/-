// ============================================
// 模块5：视频剪辑与字幕
// ============================================

import { generateId, now, generateSrt, estimateDuration } from '@/lib/utils';
import { config } from '@/config';
import type { VideoProject, VideoTrack, Subtitle, AudioMix, SubtitleStyle } from '@/lib/types';
import { db } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/** 创建视频工程 */
export async function createProject(name: string): Promise<VideoProject> {
  const project: VideoProject = {
    id: generateId(),
    name,
    tracks: [],
    subtitles: [],
    audioMix: {
      voiceVolume: 1.0,
      bgmVolume: 0.3,
      denoise: false,
      loudnessNormalization: true,
    },
    status: 'draft',
    createdAt: now(),
  };
  db.projects.save(project);
  return project;
}

/** 添加素材轨道 */
export function addTrack(
  projectId: string,
  track: Omit<VideoTrack, 'id'>
): VideoProject | undefined {
  const project = db.projects.get(projectId);
  if (!project) return undefined;

  project.tracks.push({ id: generateId(), ...track });
  db.projects.save(project);
  return project;
}

/** 设置字幕 */
export function setSubtitles(
  projectId: string,
  subtitles: Omit<Subtitle, 'id'>[]
): VideoProject | undefined {
  const project = db.projects.get(projectId);
  if (!project) return undefined;

  project.subtitles = subtitles.map(s => ({ id: generateId(), ...s }));
  db.projects.save(project);
  return project;
}

/** 从文本自动生成字幕（按句切分，均匀分配时间） */
export function autoGenerateSubtitles(
  projectId: string,
  text: string,
  totalDuration: number,
  style?: Partial<SubtitleStyle>
): VideoProject | undefined {
  const project = db.projects.get(projectId);
  if (!project) return undefined;

  // 分句
  const sentences = text
    .split(/(?<=[。！？；\n])/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  let currentTime = 0;

  const defaultStyle: SubtitleStyle = {
    fontSize: 24,
    fontFamily: 'Microsoft YaHei',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'bottom',
    animation: 'fade',
    ...style,
  };

  const subtitles: Subtitle[] = sentences.map((text, i) => {
    const duration = (text.length / totalChars) * totalDuration;
    const sub: Subtitle = {
      id: generateId(),
      text,
      startTime: currentTime,
      endTime: currentTime + duration,
      style: defaultStyle,
    };
    currentTime += duration;
    return sub;
  });

  project.subtitles = subtitles;
  db.projects.save(project);
  return project;
}

/** 校准字幕时间 */
export function calibrateSubtitles(
  projectId: string,
  offset: number
): VideoProject | undefined {
  const project = db.projects.get(projectId);
  if (!project) return undefined;

  project.subtitles = project.subtitles.map(s => ({
    ...s,
    startTime: Math.max(0, s.startTime + offset),
    endTime: Math.max(0, s.endTime + offset),
  }));

  db.projects.save(project);
  return project;
}

/** 设置音频混音 */
export function setAudioMix(
  projectId: string,
  mix: Partial<AudioMix>
): VideoProject | undefined {
  const project = db.projects.get(projectId);
  if (!project) return undefined;

  project.audioMix = { ...project.audioMix, ...mix };
  db.projects.save(project);
  return project;
}

/** 导出 SRT 字幕文件 */
export async function exportSrt(projectId: string): Promise<string> {
  const project = db.projects.get(projectId);
  if (!project) throw new Error('工程不存在');

  const srtContent = generateSrt(
    project.subtitles.map(s => ({
      text: s.text,
      startTime: s.startTime,
      endTime: s.endTime,
    }))
  );

  const outputPath = path.join(config.video.outputDir, `project_${projectId}.srt`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, srtContent, 'utf-8');

  return outputPath;
}

/** 渲染视频（调用 FFmpeg） */
export async function renderVideo(projectId: string): Promise<VideoProject> {
  const project = db.projects.get(projectId);
  if (!project) throw new Error('工程不存在');

  project.status = 'processing';
  db.projects.save(project);

  try {
    const outputPath = path.join(config.video.outputDir, `render_${projectId}.mp4`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // 导出字幕文件
    const srtPath = await exportSrt(projectId);

    // 构建 FFmpeg 命令
    if (project.tracks.length === 0) {
      throw new Error('没有素材轨道，请先添加视频或图片素材。');
    }

    const firstTrack = project.tracks[0];
    const filterComplex = buildFilterComplex(project);

    const cmd = [
      config.video.ffmpegPath,
      '-i', firstTrack.sourceUrl,
      ...(project.audioMix.bgmUrl ? ['-i', project.audioMix.bgmUrl] : []),
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-map', '[outa]',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      outputPath,
    ].join(' ');

    await execAsync(cmd, { timeout: 300000 });

    project.status = 'done';
    project.outputUrl = `/output/render_${projectId}.mp4`;
    db.projects.save(project);
    return project;
  } catch (error) {
    project.status = 'error';
    db.projects.save(project);
    throw error;
  }
}

/** 构建 FFmpeg 滤镜 */
function buildFilterComplex(proj: VideoProject): string {
  // 简化版：实际应根据 tracks 和 audioMix 复杂构建
  const filters: string[] = [];

  // 字幕叠加
  const srtPath = path.join(config.video.outputDir, `project_${proj.id}.srt`);
  filters.push(`[0:v]subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF'[outv]`);

  // 音频混合
  if (proj.audioMix.bgmUrl) {
    filters.push(
      `[0:a]volume=${proj.audioMix.voiceVolume}[voice];` +
      `[1:a]volume=${proj.audioMix.bgmVolume}[bgm];` +
      `[voice][bgm]amix=inputs=2:duration=first[outa]`
    );
  } else {
    filters.push(`[0:a]volume=${proj.audioMix.voiceVolume}[outa]`);
  }

  return filters.join(';');
}
