// ============================================
// 模块4：数字人形象生成与编辑
// ============================================

import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { AvatarConfig, AvatarResult } from '@/lib/types';
import { db } from '@/lib/db';

/** 创建数字人配置 */
export async function createAvatar(
  cfg: Omit<AvatarConfig, 'id' | 'createdAt'>
): Promise<AvatarConfig> {
  const avatar: AvatarConfig = {
    id: generateId(),
    ...cfg,
    createdAt: now(),
  };
  db.avatars.save(avatar);
  return avatar;
}

/** 获取数字人列表 */
export function listAvatars(): AvatarConfig[] {
  return db.avatars.list();
}

/** 更新数字人配置 */
export async function updateAvatar(
  id: string,
  updates: Partial<Omit<AvatarConfig, 'id' | 'createdAt'>>
): Promise<AvatarConfig | undefined> {
  const existing = db.avatars.get(id);
  if (!existing) return undefined;

  const updated: AvatarConfig = { ...existing, ...updates };
  db.avatars.save(updated);
  return updated;
}

/** 生成数字人预览图（调用 D-ID 或类似服务） */
export async function generateAvatarPreview(avatarId: string): Promise<AvatarResult> {
  const avatar = db.avatars.get(avatarId);
  if (!avatar) {
    throw new Error(`数字人 ${avatarId} 不存在。`);
  }

  const { apiKey, baseUrl } = config.avatar;

  if (!apiKey) {
    // 无 API 时返回占位结果
    return {
      id: generateId(),
      config: avatar,
      previewUrl: '/placeholders/avatar_preview.png',
      createdAt: now(),
    };
  }

  // 调用 D-ID API 生成预览
  const resp = await fetch(`${baseUrl}/talks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      source_url: avatar.appearance.hair || '',
      script: {
        type: 'text',
        input: '你好，我是你的数字人助手。',
      },
      config: {
        result_format: 'mp4',
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`数字人生成失败: ${resp.status} ${err}`);
  }

  const data = await resp.json();

  return {
    id: generateId(),
    config: avatar,
    previewUrl: data.result_url || '/placeholders/avatar_preview.png',
    videoUrl: data.result_url,
    createdAt: now(),
  };
}

/** 生成数字人驱动视频 */
export async function generateAvatarVideo(
  avatarId: string,
  audioUrl: string
): Promise<AvatarResult> {
  const avatar = db.avatars.get(avatarId);
  if (!avatar) {
    throw new Error(`数字人 ${avatarId} 不存在。`);
  }

  const { apiKey, baseUrl } = config.avatar;

  if (!apiKey) {
    throw new Error('AVATAR_API_KEY 未配置。请在 .env 中设置。');
  }

  const resp = await fetch(`${baseUrl}/talks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      source_url: avatar.appearance.hair || '',
      script: {
        type: 'audio',
        audio_url: audioUrl,
      },
      config: {
        result_format: 'mp4',
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`数字人视频生成失败: ${resp.status} ${err}`);
  }

  const data = await resp.json();

  return {
    id: generateId(),
    config: avatar,
    previewUrl: data.result_url || '',
    videoUrl: data.result_url,
    createdAt: now(),
  };
}
