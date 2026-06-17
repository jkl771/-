// ============================================
// LLM 调用适配层 - 支持本地模型和 API
// ============================================

import { config } from '@/config';
import { getLLMService } from './llm-service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const { apiKey, model, baseUrl } = config.llm;
  
  // 优先使用 API（如果配置了 key）
  if (apiKey) {
    return await chatCompletionAPI(messages, model, baseUrl, apiKey);
  }
  
  // 否则使用本地模型
  return await chatCompletionLocal(messages);
}

/** API 调用 */
async function chatCompletionAPI(messages: ChatMessage[], model: string, baseUrl: string, apiKey: string): Promise<string> {
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`LLM API 调用失败: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

/** 本地模型调用 */
async function chatCompletionLocal(messages: ChatMessage[]): Promise<string> {
  const svc = getLLMService();
  
  // 提取 system 和 user 消息
  const systemMsg = messages.find(m => m.role === 'system')?.content || '你是专业文案助手。';
  const userMsg = messages.filter(m => m.role === 'user').map(m => m.content).join('\n');
  
  const resp = await svc.call({
    action: 'generate',
    system: systemMsg,
    prompt: userMsg,
    max_tokens: 800,
    temperature: 0.7,
  });
  
  if (!resp.success) {
    throw new Error(resp.error || '本地模型调用失败');
  }
  
  return resp.data?.text || '';
}
