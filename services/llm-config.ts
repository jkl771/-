// ============================================
// TTS / Voice key decryption (server only)
// ============================================

export function decryptEnvKey(encrypted: string | undefined, salt: string | undefined): string | null {
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

export function getDecryptedLLMConfig(): { baseUrl: string; apiKey: string; model: string } | null {
  const apiKey = decryptEnvKey(process.env.LLM_ENCRYPTED_KEY, process.env.LLM_SALT);
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL || 'glm-4-flash';
  if (!apiKey || !baseUrl) return null;
  return { baseUrl, apiKey, model };
}

export function getDecryptedFishAudioConfig(): { baseUrl: string; apiKey: string } | null {
  const apiKey = decryptEnvKey(process.env.FISH_AUDIO_ENCRYPTED_KEY, process.env.TTS_SALT);
  if (!apiKey) return null;
  const baseUrl = process.env.FISH_AUDIO_BASE_URL || 'https://api.fish.audio';
  return { baseUrl, apiKey };
}

export function getDecryptedCosyVoiceConfig(): { baseUrl: string; apiKey: string } | null {
  const apiKey = process.env.DASHSCOPE_API_KEY || decryptEnvKey(process.env.COSYVOICE_ENCRYPTED_KEY, process.env.TTS_SALT);
  const baseUrl = process.env.COSYVOICE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1';
  if (!apiKey) return null;
  return { baseUrl, apiKey };
}

