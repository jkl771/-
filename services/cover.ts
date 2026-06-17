// ============================================
// 模块6：封面标题标签话题自动生成
// ============================================

import { generateId, now } from '@/lib/utils';
import { chatCompletion } from '@/lib/llm';
import type { CoverResult } from '@/lib/types';
import { db } from '@/lib/db';

interface CoverRequest {
  content: string;
  platform?: string;
  style?: 'clickbait' | 'professional' | 'creative' | 'minimalist';
  count?: number;
}

/** 自动生成封面标题标签话题 */
export async function generateCoverInfo(req: CoverRequest): Promise<CoverResult> {
  const id = generateId();
  const count = req.count || 5;
  const style = req.style || 'clickbait';

  const styleMap: Record<string, string> = {
    clickbait: '吸引眼球、制造好奇心、有冲击力',
    professional: '专业权威、数据驱动、可信',
    creative: '创意独特、有趣好玩、有记忆点',
    minimalist: '简洁直接、核心信息、干净利落',
  };

  // 1) 生成标题
  const titles = await generateTitles(req.content, styleMap[style], count, req.platform);

  // 2) 生成标签和话题
  const tagsAndTopics = await generateTagsAndTopics(req.content, req.platform, count);

  // 3) 生成简介
  const description = await generateDescription(req.content, titles[0] || '', req.platform);

  const result: CoverResult = {
    id,
    titles,
    coverImages: [], // 封面图需配合图片生成服务
    tags: tagsAndTopics.tags,
    topics: tagsAndTopics.topics,
    description,
    createdAt: now(),
  };

  db.covers.save(result);
  return result;
}

/** 生成标题候选 */
async function generateTitles(
  content: string,
  style: string,
  count: number,
  platform?: string
): Promise<string[]> {
  const platformHint = platform ? `，发布平台为${platform}` : '';

  const prompt = `根据以下视频文案，生成 ${count} 个标题。
风格要求：${style}${platformHint}
要求：
1. 每个标题 15-30 字
2. 适合短视频平台
3. 各标题角度不同，不要重复

文案内容：
${content.slice(0, 2000)}

请直接返回标题列表，每行一个，不要编号。`;

  const result = await chatCompletion([
    { role: 'system', content: '你是短视频标题创作专家。' },
    { role: 'user', content: prompt },
  ]);

  return result
    .split('\n')
    .map(s => s.replace(/^\d+[\.\)、]\s*/, '').trim())
    .filter(s => s.length > 0)
    .slice(0, count);
}

/** 生成标签和话题 */
async function generateTagsAndTopics(
  content: string,
  platform?: string,
  count: number = 10
): Promise<{ tags: string[]; topics: string[] }> {
  const platformHint = platform ? `，平台为${platform}` : '';

  const prompt = `根据以下文案，生成：
1. ${count} 个相关标签（tag，不带#）
2. ${count} 个热门话题（带#号）${platformHint}

文案：
${content.slice(0, 2000)}

请严格按 JSON 格式返回：
{ "tags": ["标签1", "标签2"], "topics": ["#话题1", "#话题2"] }`;

  const result = await chatCompletion([
    { role: 'system', content: '你是短视频运营专家，只返回合法 JSON。' },
    { role: 'user', content: prompt },
  ]);

  try {
    const parsed = JSON.parse(result);
    return {
      tags: parsed.tags || [],
      topics: parsed.topics || [],
    };
  } catch {
    return { tags: [], topics: [] };
  }
}

/** 生成简介 */
async function generateDescription(
  content: string,
  title: string,
  platform?: string
): Promise<string> {
  const platformHint = platform ? `，发布平台为${platform}` : '';

  const prompt = `根据以下视频标题和文案，生成一段视频简介（100-200字）${platformHint}。
要求：简洁有吸引力，包含核心信息，适合视频描述区。

标题：${title}
文案：${content.slice(0, 1000)}

请直接返回简介文本。`;

  const result = await chatCompletion([
    { role: 'system', content: '你是短视频简介创作专家。' },
    { role: 'user', content: prompt },
  ]);

  return result.trim();
}
