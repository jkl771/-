import type { ComplianceReport, ComplianceIssue } from "@/lib/types";

﻿// ============================================
// 文本评分系统 v5
// 每个维度输出优缺点 + 评分更细致
// ============================================

export interface TextScore {
  readability: number;
  infoDensity: number;
  emotionPower: number;
  hookStrength: number;
  sentenceVariety: number;
  lengthFit: number;
  platformFit: number;
  forbiddenRisk: number;
  overall: number;
  details: string[];
  method: 'rules' | 'llm';
  aiDetection?: number;
}

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// ========== 词库 ==========
const SWEAR_WORDS = [
  '操你妈','操你','你妈的','他妈的','妈的','妈逼','草泥马','卧槽',
  '傻逼','煞笔','沙比','nmsl','fuck','shit','bitch',
  '狗日的','王八蛋','混蛋','贱人','婊子','妓女',
  '去死吧','废物点心','脑残','智障','我操','我草','握草','尼玛','特么的',
];

const FORBIDDEN_WORDS = [
  '最好','第一','顶级','绝对','100%','永久','国家级','最高级',
  '最佳','最强','最低','最高','独家','唯一','全网最低','仅此一家',
];

const SENSITIVE_PATTERNS = [
  /赌博|博彩|彩票预测/i, /色情|裸体|性服务/i,
  /枪支|弹药|爆炸物/i, /毒品|大麻|冰毒/i, /传销|庞氏|资金盘/i,
];

const POSITIVE_EMOTION_WORDS = [
  '太棒了','太好了','太赞了','厉害','佩服','惊艳','震撼','感动','暖心','治愈',
  '破防','泪目','搞笑','可爱','甜','幸福','开心','热血','激动','兴奋',
  '期待','惊喜','靠谱','好吃','好用','推荐','喜欢','赞','完美','优秀','出色','精彩',
];

const NEGATIVE_EMOTION_WORDS = [
  '无聊','失望','难吃','垃圾','差评','踩雷','翻车','劝退','后悔','坑爹',
  '恶心','反感','烦躁','崩溃','绝望','难受','痛苦','尴尬',
];

const HOOK_WORDS = [
  '你知道吗','说真的','讲真','告诉你','秘密','真相',
  '为什么','怎么','如何','难道','到底','千万别','一定要','记住','竟然','居然','没想到',
];

const PLATFORM_WORDS: Record<string, string[]> = {
  douyin: ['家人们','老铁','宝子','绝了','太顶了','冲','下单','拍','秒杀'],
  xiaohongshu: ['种草','拔草','测评','好物','分享','日常','笔记','回购','空瓶'],
  bilibili: ['科普','硬核','解说','知识','干货','收藏','三连','一键三连'],
};

const TRANSITION_WORDS = [
  '然后','接着','不过','但是','其实','话说回来','对了','另外','而且','不仅如此',
  '重点是','关键是','说白了','换句话说','举个例子','比如','尤其是','特别是',
];

function splitSentences(text: string): string[] {
  const raw = text.split(/(?<=[。！？；\n!?])/g).flatMap((seg) => {
    const t = seg.replace(/\s+/g, "");
    if (!t) return [] as string[];
    if (t.length <= 60) return [t];
    const parts = t.split(/(?<=[，,、：:；])/g);
    const out: string[] = []; let buf = "";
    for (const part of parts) {
      if ((buf + part).replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "").length > 36 && buf) { out.push(buf); buf = part; } else { buf += part; }
    }
    if (buf) out.push(buf);
    return out;
  });
  return raw.map((x) => x.trim()).filter((x) => x.length > 0);
}

// ========== 规则评分（每个维度输出优缺点） ==========
function ruleScore(text: string): TextScore {
  // ruleScore-hardened-v1
  const details: string[] = [];
  const sentences = splitSentences(text);
  const lens = sentences.map(s => s.replace(/\s/g, '').length);
  const avgLen = lens.length === 0 ? 0 : Math.round(lens.reduce((a,b)=>a+b,0)/lens.length);
  const maxLen = lens.length === 0 ? 0 : Math.max(...lens);
  const longCount = lens.filter(l => l > 28).length;
  const veryLongCount = lens.filter(l => l > 45).length;
  const shortCount = lens.filter(l => l < 10).length;
  const lenStd = (() => { if(lens.length<2) return 0; const m=avgLen; return Math.sqrt(lens.reduce((s,x)=>s+(x-m)*(x-m),0)/lens.length); })();
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const wordCount = chineseChars + (text.match(/[A-Za-z0-9]+/g) || []).length;

  const forbiddenCount = FORBIDDEN_WORDS.filter(w => text.includes(w)).length;
  const dirtyCount = SWEAR_WORDS.filter(w => text.includes(w)).length;
  const sensitiveCount = SENSITIVE_PATTERNS.filter(p => p.test(text)).length;
  const positiveCount = POSITIVE_EMOTION_WORDS.filter(w => text.includes(w)).length;
  const negativeCount = NEGATIVE_EMOTION_WORDS.filter(w => text.includes(w)).length;
  const hookCount = HOOK_WORDS.filter(w => text.includes(w)).length;
  const transitionCount = TRANSITION_WORDS.filter(w => text.includes(w)).length;
  const exclamationCount = (text.match(/[?!]{1,}/g) || []).length;
  const questionCount = (text.match(/[??]{1,}/g) || []).length;
  const emojiCount = (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).length;

  const platformScores: Record<string, number> = {};
  for (const [k, words] of Object.entries(PLATFORM_WORDS)) {
    platformScores[k] = words.filter(w => text.includes(w)).length;
  }
  const bestPlatform = Object.entries(platformScores).sort((a,b)=>b[1]-a[1])[0];

  // readability
  let readability = 60;
  if (avgLen <= 18) { readability = 90; details.push('✅ 平均句长'+avgLen+'字，短句友好'); }
  else if (avgLen <= 26) { readability = 80; details.push('✅ 句式长短搭配好'); }
  else if (avgLen <= 36) { readability = 66; details.push('⚠️ 偏长，建议拆句'); }
  else { readability = Math.max(35, 70 - (avgLen-36)); details.push('❌ 平均句长'+avgLen+'字，太长影响理解'); }
  if (lenStd >= 6) { readability += 8; details.push('✅ 句式变化自然'); }
  if (veryLongCount > 0) { readability -= veryLongCount*5; details.push('⚠️ 存在超长句('+veryLongCount+'句>45字)，建议拆分'); }
  readability = Math.max(30, Math.min(98, readability));

  // infoDensity
  let infoDensity = 45 + Math.min(30, Math.round(wordCount/12)) + Math.min(15, transitionCount*3);
  if (wordCount < 60) infoDensity -= 10;
  if (questionCount > 0) infoDensity += 3;
  details.push(wordCount >= 160 ? '✅ 信息量充足('+wordCount+'字)' : '⚠️ 信息量偏少('+wordCount+'字)，可补充细节');
  if (transitionCount >= 2) details.push('✅ 过渡词丰富('+transitionCount+'个)');
  infoDensity = Math.max(30, Math.min(98, infoDensity));

  // emotionPower
  let emotionPower = 38 + positiveCount*6 - negativeCount*4 + Math.min(12, exclamationCount*4) + Math.min(6, emojiCount*2);
  if (hookCount > 0) emotionPower += 4;
  details.push(positiveCount >= 2 ? '✅ 情绪词充足('+positiveCount+'个)' : '⚠️ 情绪词较少，可加入感受词');
  if (negativeCount > 0) details.push('⚠️ 存在负面词('+negativeCount+'个)，影响氛围');
  emotionPower = Math.max(25, Math.min(98, emotionPower));

  // hookStrength
  let hookStrength = 40 + hookCount*10 + (questionCount>0?10:0) + Math.min(8, exclamationCount*2);
  if (/^[?!??]/.test(text.trim())) hookStrength += 6;
  details.push(hookCount > 0 ? "✅ 开头/文中有钩子词("+hookCount+"个)" : "⚠️ 缺少钩子词，建议用“你知道吗”等开头");
  hookStrength = Math.max(25, Math.min(98, hookStrength));

  // sentenceVariety
  let sentenceVariety = 50 + Math.min(20, Math.round(lenStd*1.6)) + (shortCount>0&&longCount>0?8:0);
  details.push(lenStd >= 8 ? '✅ 长短句变化好(std='+lenStd.toFixed(1)+')' : '⚠️ 句式偏单调(std='+lenStd.toFixed(1)+')');
  sentenceVariety = Math.max(35, Math.min(98, sentenceVariety));

  // lengthFit
  let lengthFit = 70;
  if (wordCount >= 120 && wordCount <= 260) lengthFit = 92;
  else if (wordCount >= 80 && wordCount <= 350) lengthFit = 80;
  else if (wordCount < 60) lengthFit = 55;
  else if (wordCount > 600) lengthFit = 55;
  details.push(wordCount <= 260 ? '✅ 长度适合短视频('+wordCount+'字)' : '⚠️ 文案偏长('+wordCount+'字)，建议精简');
  lengthFit = Math.max(30, Math.min(98, lengthFit));

  // platformFit
  let platformFit = 52;
  if (bestPlatform && bestPlatform[1] >= 2) { platformFit = 68 + Math.min(20, bestPlatform[1]*5); details.push('✅ 平台风格匹配: '+bestPlatform[0]); }
  else { details.push('⚠️ 未检测到明显平台风格词'); }
  platformFit = Math.max(35, Math.min(95, platformFit));

  // forbiddenRisk
  let forbiddenRisk = 0;
  if (forbiddenCount > 0) { forbiddenRisk += forbiddenCount*25; details.push('❌ 含违禁词('+forbiddenCount+'个)，建议替换'); }
  if (dirtyCount > 0) { forbiddenRisk += dirtyCount*30; details.push('❌ 含脏话('+dirtyCount+'个)，必须删除'); }
  if (sensitiveCount > 0) { forbiddenRisk += sensitiveCount*40; details.push('❌ 含敏感内容('+sensitiveCount+'项)，建议删除'); }
  if (forbiddenCount===0 && dirtyCount===0 && sensitiveCount===0) details.push('✅ 无违禁词和脏话');
  forbiddenRisk = Math.min(100, forbiddenRisk);

  const overall = Math.round(readability*0.25 + infoDensity*0.2 + emotionPower*0.18 + hookStrength*0.12 + sentenceVariety*0.1 + lengthFit*0.1 + platformFit*0.05);

  return { readability, infoDensity, emotionPower, hookStrength, sentenceVariety, lengthFit, platformFit, forbiddenRisk, overall, details, method: 'rules', aiDetection: 50 };
}

// ========== LLM 评分 ==========
export async function llmScore(text: string, config: LLMConfig): Promise<TextScore | null> {
  if (!config.apiKey || !config.baseUrl) return null;
  const prompt = `你是短视频文案评分专家。对以下文案评分(0-100)，返回JSON。
维度：readability可读性、infoDensity信息密度、emotionPower情绪感染力、hookStrength开头钩子力、sentenceVariety句式多样性、lengthFit长度合理性、platformFit平台适配度、forbiddenRisk违禁风险、aiDetectionAI生成感、overall综合分。
details数组：每个维度的优缺点，格式"✅优点说明"或"⚠️建议说明"或"❌问题说明"。
评分标准：脏话→emotionPower<=20/forbiddenRisk>=80。口语化不扣分。包含具体数据加分。开头有钩子词加分。长短句搭配加分。
文案：${text}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify({ model: config.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 500 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const p = JSON.parse(m[0]);
    const c = (v: number) => Math.max(0, Math.min(100, Math.round(v || 0)));
    return {
      readability: c(p.readability), infoDensity: c(p.infoDensity),
      emotionPower: c(p.emotionPower), hookStrength: c(p.hookStrength),
      sentenceVariety: c(p.sentenceVariety), lengthFit: c(p.lengthFit),
      platformFit: c(p.platformFit), forbiddenRisk: c(p.forbiddenRisk),
      overall: c(p.overall), details: Array.isArray(p.details) ? p.details : [],
      method: 'llm', aiDetection: c(p.aiDetection),
    };
  } catch { return null; }
}

// ========== 合规检查 ==========
export function checkComplianceEnhanced(text: string): ComplianceReport & { stats: any } {
  const issues: ComplianceIssue[] = [];
  const wordHits: string[] = [];
  const sensitiveHits: string[] = [];
  const dirtyHits: string[] = [];
  const summaryParts: string[] = [];
  for (const w of FORBIDDEN_WORDS) { if (text.includes(w)) { issues.push({ type: 'forbidden_word', word: w, suggestion: `替换「${w}」为温和表述`, severity: 'high' }); wordHits.push(w); } }
  for (const w of SWEAR_WORDS) { if (text.includes(w)) { issues.push({ type: 'forbidden_word', word: w, suggestion: `删除脏话「${w}」`, severity: 'high' }); dirtyHits.push(w); } }
  for (const p of SENSITIVE_PATTERNS) { if (p.test(text)) { sensitiveHits.push(p.source); issues.push({ type: 'sensitive_topic', word: '敏感题材', suggestion: '避免敏感话题', severity: 'high' }); break; } }
  const sentences = splitSentences(text);
  const avgLen = sentences.length === 0 ? 0 : sentences.reduce((s, x) => s + x.length, 0) / sentences.length;
  if (avgLen > 50) issues.push({ type: 'platform_rule', word: '句子过长', suggestion: '短视频建议每句≤40字', severity: 'low' });
  const adLaw = ['治病','疗效','药到病除','包治百病','祖传秘方','无副作用'];
  for (const w of adLaw) { if (text.includes(w)) { issues.push({ type: 'ad_law', word: w, suggestion: `删除广告法违规词「${w}」`, severity: 'high' }); wordHits.push(w); } }
  if (wordHits.length > 0) summaryParts.push(`违禁词 ${wordHits.length} 处`);
  if (dirtyHits.length > 0) summaryParts.push(`脏话 ${dirtyHits.length} 处`);
  if (sensitiveHits.length > 0) summaryParts.push(`敏感题材`);
  if (avgLen > 50) summaryParts.push(`句子偏长`);
  const totalIssues = issues.length;
  return {
    score: Math.max(0, 100 - totalIssues * 12), issues, passed: totalIssues === 0,
    summary: summaryParts.length > 0 ? summaryParts.join('；') : '未发现合规风险',
    stats: { forbiddenCount: wordHits.length, sensitiveCount: sensitiveHits.length, dirtyCount: dirtyHits.length, totalIssues, avgSentenceLen: Math.round(avgLen) },
  };
}

function checkCompliance(text: string) { return checkComplianceEnhanced(text); }

export async function scoreText(text: string, llmConfig?: LLMConfig): Promise<TextScore> {
  if (llmConfig?.apiKey && llmConfig?.baseUrl) { const llm = await llmScore(text, llmConfig); if (llm) return llm; }
  return ruleScore(text);
}
export function scoreTextSync(text: string): TextScore { return ruleScore(text); }