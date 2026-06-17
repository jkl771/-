// ============================================
// 环境配置（支持加密Key自动解密）
// ============================================

function decryptEnvKey(encrypted: string | undefined, salt: string | undefined): string | null {
  if (!encrypted || !salt) return null;
  try {
    const decoded = Buffer.from(encrypted, 'base64').toString();
    return Array.from(decoded)
      .map((ch: string, i: number) => String.fromCharCode(ch.charCodeAt(0) ^ salt.charCodeAt(i % salt.length)))
      .join('');
  } catch {
    return null;
  }
}

// 自动解密 LLM Key（优先明文，其次解密）
const llmApiKey = process.env.LLM_API_KEY || decryptEnvKey(process.env.LLM_ENCRYPTED_KEY, process.env.LLM_SALT) || '';

export const config = {
  // LLM 配置（润色、标题生成等）
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    apiKey: llmApiKey,
    model: process.env.LLM_MODEL || 'gpt-4o',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  },

  // TTS 配置（语音合成）
  tts: {
    provider: process.env.TTS_PROVIDER || 'openai',
    apiKey: process.env.TTS_API_KEY || '',
    model: process.env.TTS_MODEL || 'tts-1',
    baseUrl: process.env.TTS_BASE_URL || 'https://api.openai.com/v1',
  },

  // 数字人配置
  avatar: {
    provider: process.env.AVATAR_PROVIDER || 'did',
    apiKey: process.env.AVATAR_API_KEY || '',
    baseUrl: process.env.AVATAR_BASE_URL || 'https://api.d-id.com',
  },

  // 视频处理
  video: {
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    outputDir: process.env.VIDEO_OUTPUT_DIR || './output/videos',
  },

  // 存储
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localDir: process.env.STORAGE_LOCAL_DIR || './data',
    s3Bucket: process.env.S3_BUCKET || '',
    s3Region: process.env.S3_REGION || '',
  },

  // 多平台发布
  platforms: {
    douyin: { enabled: false, clientId: '', clientSecret: '' },
    kuaishou: { enabled: false, clientId: '', clientSecret: '' },
    bilibili: { enabled: false, clientId: '', clientSecret: '' },
    xiaohongshu: { enabled: false, clientId: '', clientSecret: '' },
    wechat_video: { enabled: false, clientId: '', clientSecret: '' },
  },

  // 合规词库
  compliance: {
    forbiddenWordsUrl: process.env.FORBIDDEN_WORDS_URL || '',
    customRules: [] as string[],
  },
} as const;
