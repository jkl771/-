// ============================================
// 模块7：多平台自动发布
// ============================================

import { generateId, now } from '@/lib/utils';
import { config } from '@/config';
import type { PublishTask, PlatformAccount, PublishResult } from '@/lib/types';
import { db } from '@/lib/db';

interface PublishRequest {
  platforms: PlatformAccount[];
  videoUrl: string;
  coverUrl: string;
  title: string;
  description: string;
  tags: string[];
  topics: string[];
  scheduledAt?: string;
}

/** 创建发布任务 */
export async function createPublishTask(req: PublishRequest): Promise<PublishTask> {
  const task: PublishTask = {
    id: generateId(),
    platforms: req.platforms,
    videoUrl: req.videoUrl,
    coverUrl: req.coverUrl,
    title: req.title,
    description: req.description,
    tags: req.tags,
    topics: req.topics,
    scheduledAt: req.scheduledAt,
    status: 'pending',
    results: [],
    createdAt: now(),
  };

  db.publishes.save(task);
  return task;
}

/** 执行发布 */
export async function executePublish(taskId: string): Promise<PublishTask> {
  const task = db.publishes.get(taskId);
  if (!task) throw new Error('发布任务不存在');

  task.status = 'publishing';
  db.publishes.save(task);

  const results: PublishResult[] = [];

  for (const platform of task.platforms) {
    try {
      const result = await publishToPlatform(platform, task);
      results.push(result);
    } catch (error) {
      results.push({
        platform: platform.platform,
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  task.results = results;
  task.status = results.some(r => r.status === 'failed') ? 'failed' : 'done';
  db.publishes.save(task);
  return task;
}

/** 发布到指定平台 */
async function publishToPlatform(
  account: PlatformAccount,
  task: PublishTask
): Promise<PublishResult> {
  const platformConfig = config.platforms[account.platform];

  if (!platformConfig?.enabled) {
    return {
      platform: account.platform,
      status: 'failed',
      error: `${account.platform} 平台未启用或未配置。`,
    };
  }

  // 各平台适配器（框架）
  switch (account.platform) {
    case 'douyin':
      return publishToDouyin(account, task);
    case 'bilibili':
      return publishToBilibili(account, task);
    case 'kuaishou':
      return publishToKuaishou(account, task);
    case 'xiaohongshu':
      return publishToXiaohongshu(account, task);
    case 'wechat_video':
      return publishToWechatVideo(account, task);
    default:
      return {
        platform: account.platform,
        status: 'failed',
        error: `不支持的平台: ${account.platform}`,
      };
  }
}

// ---- 各平台发布适配器（框架实现）----

async function publishToDouyin(
  _account: PlatformAccount,
  _task: PublishTask
): Promise<PublishResult> {
  // TODO: 接入抖音开放平台 API
  // 1. OAuth 鉴权
  // 2. 上传视频
  // 3. 设置标题、封面、标签
  // 4. 发布
  return {
    platform: 'douyin',
    status: 'failed',
    error: '抖音发布功能待接入。需要配置抖音开放平台应用凭证。',
  };
}

async function publishToBilibili(
  _account: PlatformAccount,
  _task: PublishTask
): Promise<PublishResult> {
  // TODO: 接入 B 站投稿 API
  return {
    platform: 'bilibili',
    status: 'failed',
    error: 'B站发布功能待接入。需要配置B站开放平台应用凭证。',
  };
}

async function publishToKuaishou(
  _account: PlatformAccount,
  _task: PublishTask
): Promise<PublishResult> {
  return {
    platform: 'kuaishou',
    status: 'failed',
    error: '快手发布功能待接入。',
  };
}

async function publishToXiaohongshu(
  _account: PlatformAccount,
  _task: PublishTask
): Promise<PublishResult> {
  return {
    platform: 'xiaohongshu',
    status: 'failed',
    error: '小红书发布功能待接入。',
  };
}

async function publishToWechatVideo(
  _account: PlatformAccount,
  _task: PublishTask
): Promise<PublishResult> {
  return {
    platform: 'wechat_video',
    status: 'failed',
    error: '视频号发布功能待接入。',
  };
}

/** 获取发布历史 */
export function listPublishTasks(): PublishTask[] {
  return db.publishes.list();
}

/** 重试失败的发布 */
export async function retryPublish(taskId: string, platform?: string): Promise<PublishTask> {
  const task = db.publishes.get(taskId);
  if (!task) throw new Error('发布任务不存在');

  const failedResults = task.results.filter(
    r => r.status === 'failed' && (!platform || r.platform === platform)
  );

  for (const failed of failedResults) {
    const account = task.platforms.find(p => p.platform === failed.platform);
    if (account) {
      try {
        const result = await publishToPlatform(account, task);
        const idx = task.results.findIndex(r => r.platform === failed.platform);
        if (idx >= 0) task.results[idx] = result;
      } catch (error) {
        failed.error = error instanceof Error ? error.message : '重试失败';
      }
    }
  }

  task.status = task.results.every(r => r.status === 'success') ? 'done' : 'failed';
  db.publishes.save(task);
  return task;
}
