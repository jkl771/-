// ============================================
// 视频智能体 - 全局类型定义
// ============================================

/** 链接文案提取 */
export interface ExtractedContent {
  id: string;
  url: string;
  platform: string;
  title: string;
  author: string;
  rawText: string;
  segments: ContentSegment[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ContentSegment {
  id: string;
  text: string;
  startTime?: number;
  endTime?: number;
  type: 'narration' | 'dialogue' | 'caption';
}

/** 文案润色 */
export interface PolishRequest {
  text: string;
  style: 'casual' | 'storytelling' | 'sales' | 'educational';
  mode: 'rewrite' | 'expand' | 'condense';
  targetLength?: number;
  llmConfig?: { baseUrl?: string; apiKey?: string; model?: string };
}

export interface PolishResult {
  id: string;
  original: string;
  polished: string;
  complianceReport: ComplianceReport;
  originalityScore: number;
  versions: string[];
  createdAt: string;
  materialVersionId: string;
}

export interface ComplianceReport {
  score: number;
  issues: ComplianceIssue[];
  passed: boolean;
  summary?: string;
  stats?: {
    forbiddenCount: number;
    sensitiveCount: number;
    dirtyCount: number;
    totalIssues: number;
    avgSentenceLen: number;
  };
}

export interface ComplianceIssue {
  type: 'forbidden_word' | 'sensitive_topic' | 'ad_law' | 'platform_rule';
  word: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

/** 声音克隆 */
export interface VoiceConfig {
  id: string;
  name: string;
  speed: number;
  pitch: number;
  pauseDuration: number;
  emotion: 'neutral' | 'happy' | 'sad' | 'excited' | 'serious';
  sampleUrl?: string;
  voiceId?: string;
  source?: string;
  createdAt: string;
}

export interface TTSRequest {
  text: string;
  voiceConfig: VoiceConfig;
}

export interface TTSResult {
  id: string;
  audioUrl: string;
  duration: number;
  voiceConfig: VoiceConfig;
  createdAt: string;
}

/** 数字人 */
export interface AvatarConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  ageRange: 'young' | 'middle' | 'senior';
  style: 'realistic' | 'anime' | 'cartoon' | '3d';
  appearance: {
    hair: string;
    skin: string;
    clothing: string;
  };
  background: string;
  resolution: '720p' | '1080p' | '4k';
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
}

export interface AvatarResult {
  id: string;
  config: AvatarConfig;
  previewUrl: string;
  videoUrl?: string;
  createdAt: string;
}

/** 视频剪辑 */
export interface VideoProject {
  id: string;
  name: string;
  tracks: VideoTrack[];
  subtitles: Subtitle[];
  audioMix: AudioMix;
  status: 'draft' | 'processing' | 'done' | 'error';
  outputUrl?: string;
  createdAt: string;
}

export interface VideoTrack {
  id: string;
  type: 'video' | 'image' | 'avatar';
  sourceUrl: string;
  startTime: number;
  duration: number;
  transition?: 'cut' | 'fade' | 'slide' | 'zoom';
}

export interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: SubtitleStyle;
}

export interface SubtitleStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  animation: 'none' | 'fade' | 'typewriter' | 'bounce';
}

export interface AudioMix {
  voiceVolume: number;
  bgmVolume: number;
  bgmUrl?: string;
  denoise: boolean;
  loudnessNormalization: boolean;
}

/** 封面与标签 */
export interface CoverResult {
  id: string;
  titles: string[];
  coverImages: string[];
  tags: string[];
  topics: string[];
  description: string;
  createdAt: string;
}

/** 多平台发布 */
export interface PublishTask {
  id: string;
  platforms: PlatformAccount[];
  videoUrl: string;
  coverUrl: string;
  title: string;
  description: string;
  tags: string[];
  topics: string[];
  scheduledAt?: string;
  status: 'pending' | 'publishing' | 'done' | 'failed';
  results: PublishResult[];
  createdAt: string;
}

export interface PlatformAccount {
  platform: 'douyin' | 'kuaishou' | 'bilibili' | 'xiaohongshu' | 'wechat_video';
  accountId: string;
  accountName: string;
}

export interface PublishResult {
  platform: string;
  status: 'success' | 'failed' | 'pending_review';
  videoId?: string;
  error?: string;
  publishedAt?: string;
}

/** 工作流 */
export interface WorkflowStep {
  id: string;
  module: string;
  status: 'pending' | 'running' | 'done' | 'error';
  input: unknown;
  output: unknown;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'draft' | 'in_progress' | 'done';
  createdAt: string;
  updatedAt: string;
}
