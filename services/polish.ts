// ============================================
// 模块2：文案润色 v7
// AI优化token + 扩充/精简改进 + 返回usage
// ============================================

import { generateId, now, jaccardSimilarity } from '@/lib/utils';
import type { PolishRequest, PolishResult, ComplianceReport, ComplianceIssue } from '@/lib/types';
import { db } from '@/lib/db';
import { scoreTextSync, checkComplianceEnhanced, type LLMConfig } from '@/services/text-scorer';
import fs from 'fs';
import path from 'path';

const HOOK_WORDS: string[] = ['????','???','??','???','??','??','???','??','??','??','??','???','???','??','??','??','???'];
const PLATFORM_WORDS: Record<string, string[]> = {
  douyin: ['???','??','??','??','???','?','??','?','??'],
  xiaohongshu: ['??','??','??','??','??','??','??','??','??'],
  bilibili: ['??','??','??','??','??','??','??','????'],
};

const TEMPLATES_PATH = path.join(process.cwd(), 'data', 'builtin_templates.json');
function loadTemplates() {
  try { return JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf-8')); }
  catch { return { categories: {}, emotions: {}, hooks: {}, forbiddenWords: [], forbiddenReplacements: {} }; }
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function casualRewrite(text: string): string {
  const t = loadTemplates();
  const c = t?.categories?.casual;
  const inSentences = text.split(/(?<=[。！？；\n])/g).map((x)=>x.trim()).filter(Boolean);
  const opener = pick(c?.openers || ["说真的，","你知道吗？","我跟你讲，"]);
  const closer = pick(c?.closers || ["这波真的绝了。","你学会了吗？","赶紧试试吧！"]);
  const transitions = (c?.transitions || ["然后","不过","其实","而且","关键是","重点是","换句话说"]).slice(0,8);
  const platformWords = PLATFORM_WORDS["douyin"] || [];
  const out: string[] = [];
  for (let i=0;i<inSentences.length;i++){
    let s = inSentences[i];
    if(!s) continue;
    if(i===0){ const hook = HOOK_WORDS.find((w: string)=>s.includes(w)) ? "" : opener; s = hook + s; }
    if(i>0 && i%2===0){ s = pick(transitions) + "，" + s; }
    if(i===inSentences.length-1){ s = s.replace(/[。]*$/,"") + "。" + closer; }
    out.push(s);
    if(i!==inSentences.length-1 && Math.random()>0.55){
      const emotionKeys=Object.keys(t?.emotions||{});
      if(emotionKeys.length){ const words=t.emotions[pick(emotionKeys)]; if(words?.length) out.push(pick(words)+"！"); }
    }
  }
  if(platformWords.length>=2 && !platformWords.some((w: string)=>out.join("").includes(w))){ out.splice(1,0, pick(platformWords)+"，听我说完"); }
  return out.join("");
}


function storytellingRewrite(text: string): string {
  const t = loadTemplates();
  const c = t?.categories?.storytelling;
  const inSentences = text.split(/(?<=[。！？；\n])/g).map((x)=>x.trim()).filter(Boolean);
  const opener = pick(c?.openers || ["你知道吗？","那天我试了一次，","有件事我一直想说，"]);
  const closer = pick(c?.closers || ["这就是我的经验。","这招我一般不告诉别人。","信我一次，你会回来谢我。"]);
  const transitions = (c?.transitions || ["没想到","转折是","后来发现","最后"]).slice(0,6);
  const out: string[] = [String(opener)];
  for (let i=0;i<inSentences.length;i++){
    let s = inSentences[i];
    if(!s) continue;
    if(i===1 && inSentences.length>2){ s = s + "。但故事还没结束，"; }
    if(i>1 && i%2===0){ s = pick(transitions) + "，" + s; }
    if(i===inSentences.length-1){ s = s.replace(/[。]*$/,"") + "。" + closer; }
    out.push(s);
  }
  return out.join("");
}


function salesRewrite(text: string): string {
  const t = loadTemplates();
  const c = t?.categories?.sales;
  const inSentences = text.split(/(?<=[。！？；\n])/g).map((x)=>x.trim()).filter(Boolean);
  const opener = pick(c?.openers || ["🔥 这个你一定要知道：","如果你也遇到这个问题，","自用款分享："]);
  const closer = pick(c?.closers || ["赶紧冲，链接在评论区！","错过等一年，赶紧下单！","不试你会后悔的！"]);
  const transitions = (c?.transitions || ["说实话","重点是","关键是","而且"]).slice(0,6);
  const out: string[] = [String(opener)];
  for (let i=0;i<inSentences.length;i++){
    let s = inSentences[i];
    if(!s) continue;
    if(i===1){ s = "说实话，" + s; }
    if(i>1 && i%2===1){ s = pick(transitions) + "，" + s; }
    if(i===inSentences.length-1){ s = s.replace(/[。]*$/,"") + "。" + closer; }
    out.push(s);
  }
  return out.join("");
}


function educationalRewrite(text: string): string {
  const t = loadTemplates();
  const c = t?.categories?.educational;
  const inSentences = text.split(/(?<=[。！？；\n])/g).map((x)=>x.trim()).filter(Boolean);
  const opener = pick(c?.openers || ["【科普】今天聊个关键点：","很多人不知道，","划重点："]);
  const closer = pick(c?.closers || ["建议收藏，反复看！","这波干货你学会了吗？","先码住，迟早用得上。"]);
  const transitions = (c?.transitions || ["换句话说","举个例子","尤其是","重点是"]).slice(0,6);
  const out: string[] = [String(opener)];
  for (let i=0;i<inSentences.length;i++){
    let s = inSentences[i];
    if(!s) continue;
    if(i===0){ s = s + "。这很重要。"; }
    if(i>0 && i%2===0){ s = pick(transitions) + "，" + s; }
    if(i===inSentences.length-1){ s = s.replace(/[。]*$/,"") + "。" + closer; }
    out.push(s);
  }
  return out.join("");
}



function expandText(text: string): string {
  // expand-hardened-v1
  const t = loadTemplates();
  const inSentences = text.split(/(?<=[????\n])/g).map(x=>x.trim()).filter(Boolean);
  const out: string[] = [];
  const expanders = [
    '??????????????????',
    '?????????????????',
    '????????????????',
    '????????????????',
    '??????????????????',
    '????????????????????',
  ];
  const transitions = (t.categories?.casual?.transitions || ['然后','不过','其实','另外']).slice(0,8);
  const pickArr=(a: string[])=>a[Math.floor(Math.random()*a.length)];
  let addedHook=false;
  for (let i=0;i<inSentences.length;i++){
    let s=inSentences[i];
    if(!s) continue;
    if(i===0 && !HOOK_WORDS.some((w: string)=>s.includes(w))){ s = pickArr(['你知道吗？','说真的，','我跟你讲，']) + s; addedHook=true; }
    if(i>0 && i%2===0){ s = pickArr(transitions) + '?' + s; }
    out.push(s);
    if(i!==inSentences.length-1 && Math.random()>0.45){ out.push(pickArr(expanders)); }
    if(Math.random()>0.6){
      const emotionKeys=Object.keys(t.emotions||{});
      if(emotionKeys.length){ const words=t.emotions[pickArr(emotionKeys)]; if(words?.length) out.push(pickArr(words)+'?'); }
    }
  }
  if(inSentences.length>=3){
    const last=inSentences[inSentences.length-1];
    if(!/[?!]$/.test(last)) out.push(pickArr(['??????','???????','???????','???????????']));
  }
  return out.join('');
}


function condenseText(text: string): string {
  // condense-hardened-v1
  const inSentences = text.split(/(?<=[????\n])/g).map(x=>x.trim()).filter(Boolean);
  if(inSentences.length<=3) return text;
  const scored = inSentences.map((s,i)=>{
    let score=0;
    if(i===0) score+=5;
    if(i===inSentences.length-1) score+=4;
    if(/[0-9]+/.test(s) || /[一二三四五六七八九十百千万]+/.test(s)) score+=3;
    if(['关键','核心','重点','秘诀','方法','步骤','技巧','结果','结论','没想到','所以'].some(k=>s.includes(k))) score+=3;
    if(HOOK_WORDS.some((w: string)=>s.includes(w))) score+=2;
    if(s.replace(/\s/g,'').length<=22) score+=2;
    return {s,score,i};
  }).sort((a,b)=>b.score-a.score);
  const keepCount=Math.max(4, Math.ceil(inSentences.length*0.62));
  const keepSet=new Set(scored.slice(0,keepCount).map(x=>x.i));
  const out=inSentences.filter((_,i)=>keepSet.has(i));
  return out.join('');
}


// ========== AI 润色（返回 usage） ==========
interface AIResult { text: string | null; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null; }

async function aiRewrite(text: string, style: string, mode: string, config: LLMConfig): Promise<AIResult> {
  const sMap: Record<string, string> = {
    casual: '口语化风格：用我/你拉近距离，加语气词(嘛吧呢啊)，用说真的/你知道吗等口头禅，短句为主像跟朋友聊天，适当感叹表达真实感受',
    storytelling: '故事化风格：用那天/有一次开头制造场景感，设置悬念(你知道后来怎样了吗)，有转折(没想到/结果居然)，用细节描写(时间地点感受)，结尾给结论或感悟',
    sales: '带货风格：开头直接说痛点或好处，用自用款/回购N次增加信任，列举具体卖点不是形容词堆砌，制造紧迫感(限时/限量/错过等一年)，结尾号召行动(赶紧冲/链接在评论区)',
    educational: '知识讲解风格：用90%的人不知道制造信息差，先说结论再解释原因，用举个例子降低理解门槛，数据和案例支撑，结尾总结要点加引导收藏',
  };
  const mMap: Record<string, string> = {
    rewrite: '改写：保持核心信息不变，换表达方式和句式结构，控制在原文正负20%长度，不要简单换同义词要重新组织语言',
    expand: '扩写：每句话后加具体细节(时间地点感受对比)，增加场景描写让读者有画面感，加入口语化过渡词(其实/说实话/你猜怎么着)，结尾加总结或行动号召，输出长度必须是原文1.5-2倍',
    condense: '精简：删除重复意思的句子，去掉修饰性废话保留核心信息，合并相似句子，保留最有冲击力的表达，输出长度控制在原文50-70%',
  };
  const prompt = `你是短视频文案专家。请${mMap[mode]||'改写'}以下文案。
${sMap[style]||sMap.casual}
规则：中文、自然口语化、不用违禁词(最好/第一/顶级/绝对等)。直接输出润色后的文案不要解释。
原文：${text}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: mode === 'expand' ? 2000 : 1000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { text: null, usage: null };
    const data = await res.json();
    const usage = data.usage || null;
    const content = data.choices?.[0]?.message?.content?.trim() || null;
    return { text: content, usage };
  } catch { return { text: null, usage: null }; }
}

function fixCompliance(text: string, issues: ComplianceIssue[]): string {
  const reps = loadTemplates().forbiddenReplacements || {};
  let r = text;
  for (const i of issues) { if (i.type === 'forbidden_word' && reps[i.word]) r = r.replace(new RegExp(i.word, 'g'), reps[i.word]); }
  return r;
}

function calcOriginality(orig: string, vers: string[]): number {
  if (vers.length === 0) return 0;
  return Math.round((1 - vers.map(v => jaccardSimilarity(orig, v)).reduce((a, b) => a + b, 0) / vers.length) * 100);
}

function getActiveMaterialVersionId(): string {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'materials_library.json'), 'utf-8')).activeVersionId || 'builtin-v1'; }
  catch { return 'builtin-v1'; }
}

// ========== 主函数 ==========
export async function polishContent(req: PolishRequest): Promise<PolishResult & { tokenUsage?: any }> {
  const id = generateId();
  const { text, style, mode } = req; const llmConfig = (req as any).llmConfig;
  const hasLLM = !!(llmConfig?.apiKey && llmConfig?.baseUrl);
  let totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // 生成候选（AI 2次 + 规则1次，省 token）
  const candidates: string[] = [];
  if (hasLLM) {
    const results = await Promise.all([
      aiRewrite(text, style, mode, llmConfig as LLMConfig),
      aiRewrite(text, style, mode, llmConfig as LLMConfig),
    ]);
    for (const r of results) {
      if (r.text && r.text.length > 5) candidates.push(r.text);
      if (r.usage) {
        totalUsage.prompt_tokens += r.usage.prompt_tokens || 0;
        totalUsage.completion_tokens += r.usage.completion_tokens || 0;
        totalUsage.total_tokens += r.usage.total_tokens || 0;
      }
    }
  }
  // 规则补充到 3 个
  if (candidates.length < 3) {
    const gens: Record<string, () => string> = {
      casual: () => casualRewrite(text), storytelling: () => storytellingRewrite(text),
      sales: () => salesRewrite(text), educational: () => educationalRewrite(text),
    };
    const gen = mode === 'expand' ? () => expandText(text) : mode === 'condense' ? () => condenseText(text) : (gens[style] || gens.casual);
    while (candidates.length < 3) candidates.push(gen());
  }

  // 统一评分
  const scored = candidates.map(t => ({ text: t, score: scoreTextSync(t) }));
  const bestIdx = scored.reduce((bi, s, i, arr) => s.score.overall > arr[bi].score.overall ? i : bi, 0);
  let polished = scored[bestIdx].text;
  let polishedScore = scored[bestIdx].score;

  // 合规检查
  let complianceReport = checkComplianceEnhanced(polished) as ComplianceReport;
  if (complianceReport.issues.length > 0) {
    polished = fixCompliance(polished, complianceReport.issues);
    complianceReport = checkComplianceEnhanced(polished) as ComplianceReport;
    polishedScore = scoreTextSync(polished);
    scored[bestIdx] = { text: polished, score: polishedScore };
  }

  const result: PolishResult & { tokenUsage?: any } = {
    id, original: text, polished, complianceReport, originalityScore: calcOriginality(text, scored.map(s => s.text)),
    versions: scored.map(s => s.text), ...( { versionScores: scored.map(s => s.score) } ),
    ...( { polishedScore } ), materialVersionId: getActiveMaterialVersionId(), createdAt: now(),
    tokenUsage: hasLLM ? totalUsage : undefined,
  };
  db.polishes.save(result);
  return result;
}