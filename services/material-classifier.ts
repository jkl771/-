// ============================================
// 素材分类识别器（规则优先版）
// 自动识别素材的风格/情绪/句式/平台/长度等标签
// ============================================

export interface MaterialTags {
  style: string[];       // casual, storytelling, sales, educational
  emotion: string[];     // humor, surprise, empathy, urgency, authority
  hookType: string[];    // question, contrast, story, data, command
  platform: string[];    // douyin, xiaohongshu, bilibili, wechat
  scene: string[];       // food, tech, lifestyle, education, finance
  length: 'short' | 'medium' | 'long';
  quality: number;       // 0-100
}

export interface ClassifiedMaterial {
  text: string;
  tags: MaterialTags;
  addedAt: string;
  source: 'manual' | 'crawler' | 'import';
  status: 'candidate' | 'approved' | 'rejected';
}

// ========== 风格关键词 ==========
const STYLE_KEYWORDS: Record<string, string[]> = {
  casual: ['说真的', '其实呢', '你知道吗', '讲真', '说实话', '怎么说呢', '就是说', '哎', '嘛', '吧', '哈哈', '哈哈', '天呐', '绝了', '真的', '太', '超级', '巨', '贼'],
  storytelling: ['从前', '有一天', '话说', '记得', '那时候', '突然', '没想到', '结果', '后来', '最后', '其实', '真相是', '秘密', '隐藏', '背后', '第一次', '那年', '那天下', '有一次', '直到', '才发现', '才知道', '终于', '故事', '经历', '曾经', '以前', '从此', '改变', '转折'],
  sales: ['赶紧', '限时', '错过', '必买', '推荐', '种草', '安利', '入手', '回购', '断货', '爆款', '性价比', '划算', '便宜', '省钱', '下单', '购买', '空瓶', '自用款', '闭眼入', '冲', '安利给你们', '吹爆', '回购到', '必入', '别错过', '碾压', '后悔', '省了', '别再', '买到', '清单', '活动', '限时', '价格'],
  educational: ['科普', '原理', '科学', '研究', '数据', '统计', '专家', '学者', '论文', '实验证明', '根据', '分析', '解释', '原因', '机制', '方法论', '教你', '提醒', '为什么', '你知道吗', '研究表明', '世卫组织', '基础代谢', '正确做法', '根本原因', '正确', '分辨', '冷知识', '万能公式', '秘诀', '方法', '技巧', '建议', '风险', '危害'],
};

// ========== 情绪关键词 ==========
const EMOTION_KEYWORDS: Record<string, string[]> = {
  humor: ['哈哈', '笑死', '搞笑', '沙雕', '离谱', '无语', '绝了', '太逗', '笑不活了', '裂开'],
  surprise: ['竟然', '没想到', '震惊', '惊呆', '不敢相信', '万万没想到', '居然', '原来', '真相'],
  empathy: ['心疼', '理解', '感同身受', '共鸣', '泪目', '破防', '太难了', '谁懂', '家人们'],
  urgency: ['赶紧', '马上', '立刻', '快', '抓紧', '别错过', '最后', '仅剩', '倒计时', '限时'],
  authority: ['专家', '权威', '官方', '研究证明', '数据表明', '科学', '专业', '认证', '背书'],
};

// ========== 句式特征 ==========
const HOOK_PATTERNS: Record<string, RegExp[]> = {
  question: [/[？?]/, /^为什么/, /^怎么/, /^如何/, /^难道/, /^到底/, /^究竟是/],
  contrast: [/但是/, /然而/, /却/, /反而/, /竟然/, /居然/, /不是.*而是/, /与其.*不如/],
  story: [/从前/, /有一天/, /记得/, /那时候/, /话说/],
  data: [/\d+%/, /\d+倍/, /\d+万/, /\d+亿/, /第[一二三四五]/, /超过/, /达到/, /突破/],
  command: [/赶紧/, /快去/, /一定要/, /千万别/, /记住/, /建议/, /推荐/],
};

// ========== 平台特征 ==========
const PLATFORM_KEYWORDS: Record<string, string[]> = {
  douyin: ['抖音', '短视频', '直播', '带货', '种草', '家人们', '老铁', '宝子'],
  xiaohongshu: ['小红书', '笔记', '种草', '拔草', '测评', '好物', '分享', '日常'],
  bilibili: ['B站', 'up主', '弹幕', '三连', '一键三连', '硬核', '科普', '解说'],
  wechat: ['公众号', '朋友圈', '转发', '收藏', '关注', '私域', '裂变'],
};

// ========== 场景关键词 ==========
const SCENE_KEYWORDS: Record<string, string[]> = {
  food: ['美食', '好吃', '餐厅', '做饭', '菜谱', '小吃', '火锅', '烧烤', '甜品', '汉堡', '炸鸡', '鸡柳', '奶茶'],
  tech: ['科技', 'AI', '人工智能', '互联网', '编程', '代码', '算法', '芯片', '手机', '电脑'],
  lifestyle: ['生活', '日常', '穿搭', '化妆', '护肤', '健身', '减肥', '旅行', '家居', '收纳'],
  education: ['学习', '教育', '考试', '知识', '科普', '历史', '文化', '物理', '化学', '数学'],
  finance: ['理财', '投资', '股票', '基金', '赚钱', '收入', '工资', '副业', '创业', '经济'],
};

// ========== 违禁词 ==========
const FORBIDDEN_WORDS = [
  '最好', '第一', '顶级', '绝对', '100%', '永久',
  '国家级', '最高级', '最佳', '最强', '最低', '最高',
  '独家', '唯一', '全网最低', '仅此一家',
];

// ========== 敏感题材 ==========
const SENSITIVE_PATTERNS = [
  /赌博|博彩|彩票预测/i,
  /色情|裸体|性服务/i,
  /枪支|弹药|爆炸物/i,
  /毒品|大麻|冰毒/i,
  /传销|庞氏|资金盘/i,
];

function matchKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter(k => text.includes(k));
}

function matchPatterns(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text));
}

function calcLength(text: string): 'short' | 'medium' | 'long' {
  const len = text.replace(/\s/g, '').length;
  if (len < 50) return 'short';
  if (len < 200) return 'medium';
  return 'long';
}

function calcQuality(text: string): number {
  let score = 80;
  
  // 违禁词扣分
  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) score -= 10;
  }
  
  // 敏感题材扣分
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) score -= 20;
  }
  
  // 长度适中加分
  const len = text.replace(/\s/g, '').length;
  if (len >= 30 && len <= 500) score += 10;
  
  // 有标点加分
  if (/[。！？!?]/.test(text)) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

/** 对文本进行自动分类打标签 */
export function classifyText(text: string): MaterialTags {
  const style: string[] = [];
  const emotion: string[] = [];
  const hookType: string[] = [];
  const platform: string[] = [];
  const scene: string[] = [];

  // 风格识别：只归属匹配关键词数最多的风格
  let bestStyle = 'casual';
  let bestScore = 0;
  for (const [s, keywords] of Object.entries(STYLE_KEYWORDS)) {
    const score = matchKeywords(text, keywords).length;
    if (score > bestScore) { bestScore = score; bestStyle = s; }
  }
  style.push(bestStyle);

  // 情绪识别
  for (const [e, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    if (matchKeywords(text, keywords).length >= 1) emotion.push(e);
  }

  // 句式识别
  for (const [h, patterns] of Object.entries(HOOK_PATTERNS)) {
    if (matchPatterns(text, patterns)) hookType.push(h);
  }

  // 平台识别
  for (const [p, keywords] of Object.entries(PLATFORM_KEYWORDS)) {
    if (matchKeywords(text, keywords).length >= 1) platform.push(p);
  }

  // 场景识别
  for (const [s, keywords] of Object.entries(SCENE_KEYWORDS)) {
    if (matchKeywords(text, keywords).length >= 1) scene.push(s);
  }

  return {
    style,
    emotion,
    hookType,
    platform,
    scene,
    length: calcLength(text),
    quality: calcQuality(text),
  };
}

/** 批量分类素材 */
export function classifyBatch(texts: string[]): ClassifiedMaterial[] {
  const now = new Date().toISOString();
  return texts.map(text => ({
    text,
    tags: classifyText(text),
    addedAt: now,
    source: 'manual' as const,
    status: 'candidate' as const,
  }));
}
