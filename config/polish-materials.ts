// ============================================
// 润色素材库配置文件
// 在这里添加更多素材和规则
// ============================================

import fs from 'fs';
import path from 'path';

export type MaterialVersion = {
  id: string;
  name: string;
  source: 'builtin' | 'remote';
  sourceUrl?: string;
  createdAt: string;
  items: string[];
};

export type PolishMaterialsConfig = {
  versions: MaterialVersion[];
  activeVersionId: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'materials_library.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function builtinVersion(): MaterialVersion {
  return {
    id: 'builtin-v1',
    name: '内置基础素材',
    source: 'builtin',
    createdAt: new Date().toISOString(),
    items: [
      '口语化替换: 是->就是, 有->有着, 非常->超级',
      '故事开头: 你知道吗？/ 说起来你可能不信，',
      '带货风格: 好->超赞, 不错->太棒了',
      '知识标签: 【科普】'
    ],
  };
}

export function loadMaterialsConfig(): PolishMaterialsConfig {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(CONFIG_PATH)) {
    const init: PolishMaterialsConfig = {
      versions: [builtinVersion()],
      activeVersionId: 'builtin-v1',
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    const init: PolishMaterialsConfig = { versions: [builtinVersion()], activeVersionId: 'builtin-v1' };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
}

export function saveMaterialsConfig(cfg: PolishMaterialsConfig) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

export function getActiveMaterialItems(): string[] {
  const cfg = loadMaterialsConfig();
  const v = cfg.versions.find(x => x.id === cfg.activeVersionId) || cfg.versions[0];
  return v?.items || [];
}

// ========== 口语化替换规则 ==========
export const CASUAL_REPLACEMENTS: Record<string, string> = {
  '是': '就是',
  '有': '有着',
  '可以': '能够',
  '非常': '超级',
  '很好': '很棒',
  '提供': '带来',
  '包含': '有着',
  '实现': '达到',
  '使用': '用',
  '进行': '做',
  '因为': '因为说',
  '所以': '所以呢',
  '但是': '不过',
  '然而': '但是呢',
  '虽然': '虽说',
  '认为': '觉得',
  '发现': '发现说',
  '需要': '得',
  '重要': '关键',
  '可能': '说不定',
  '已经': '早就',
};

// ========== 故事化开头 ==========
export const STORY_OPENERS: string[] = [
  '你知道吗？',
  '说起来你可能不信，',
  '有个有趣的事：',
  '让我告诉你一个秘密：',
  '你有没有想过，',
  '话说，',
  '告诉你一个真相：',
  '其实呢，',
  '很多人都不知道，',
];

// ========== 带货风格替换 ==========
export const SALES_REPLACEMENTS: Record<string, string> = {
  '是': '绝对是',
  '有': '足足有',
  '好': '超赞',
  '可以': '轻松',
  '提供': '给你满满的',
  '完美': '绝了',
  '不错': '太棒了',
  '很好': '超级好',
};

// ========== 扩写素材库 ==========
export const EXPAND_FACTS: Record<string, string[]> = {
  '碳水': [
    '碳水化合物是身体的主要能量来源，占每日热量的50-60%',
    '优质碳水能提供持久能量，避免血糖波动',
    '全谷物碳水富含B族维生素，有助于新陈代谢'
  ],
  '蛋白': [
    '蛋白质是肌肉生长和修复的关键营养素',
    '每天需要摄入体重(kg)×1.2-1.5克蛋白质',
    '优质蛋白来源包括肉、蛋、奶、豆类'
  ],
  '纤维': [
    '膳食纤维促进肠道健康，预防便秘',
    '每天需要25-35克膳食纤维',
    '蔬菜水果是膳食纤维的最佳来源'
  ],
  '蔬菜': [
    '蔬菜富含维生素、矿物质和抗氧化物质',
    '每天建议摄入300-500克蔬菜',
    '深色蔬菜营养价值更高'
  ],
  '脂肪': [
    '适量脂肪有助于脂溶性维生素吸收',
    '不饱和脂肪酸对心血管健康有益',
    '坚果、鱼类富含健康脂肪'
  ],
  '历史': [
    '历史是一面镜子，可以让我们更好地理解现在',
    '学习历史能帮助我们避免重蹈覆辙',
    '每个朝代都有其独特的贡献和局限性'
  ],
  '明朝': [
    '明朝是中国历史上最后一个汉族建立的封建王朝',
    '明朝在科技、文化、经济方面都有显著成就',
    '郑和下西洋展示了明朝的海上实力'
  ],
  '唐朝': [
    '唐朝是中国历史上最繁荣的朝代之一',
    '唐朝的诗歌文化达到了巅峰',
    '唐朝的对外交流非常频繁'
  ],
  '科技': [
    '科技是第一生产力，推动社会进步',
    '创新是引领发展的第一动力',
    '科技改变生活，智慧创造未来'
  ],
  '人工智能': [
    '人工智能正在改变我们的生活方式',
    'AI技术在医疗、教育、交通等领域有广泛应用',
    '人工智能的发展将带来更多便利和挑战'
  ],
  '互联网': [
    '互联网让世界变成了地球村',
    '网络技术改变了信息传播的方式',
    '互联网经济已成为新的增长点'
  ],
  '教育': [
    '教育是民族振兴和社会进步的基石',
    '好的教育应该培养独立思考能力',
    '知识改变命运，学习成就未来'
  ],
  '学习': [
    '学习是终身的事业，永无止境',
    '主动学习比被动接受更有效',
    '学习方法比学习时间更重要'
  ],
  '经济': [
    '经济发展是社会进步的物质基础',
    '高质量发展是新时代的硬道理',
    '创新是引领经济发展的第一动力'
  ],
  '消费': [
    '消费是拉动经济增长的重要引擎',
    '理性消费有助于个人财务健康',
    '消费升级反映了人民生活水平的提高'
  ],
};

// ========== 违禁词库 ==========
export const FORBIDDEN_WORDS: string[] = [
  '最好', '第一', '顶级', '绝对', '100%', '永久',
  '国家级', '最高级', '最佳', '最强', '最低', '最高',
  '独家', '唯一', '全网最低', '仅此一家',
];

// ========== 敏感题材 ==========
export const SENSITIVE_PATTERNS: RegExp[] = [
  /赌博|博彩|彩票预测/i,
  /色情|裸体|性服务/i,
  /枪支|弹药|爆炸物/i,
  /毒品|大麻|冰毒/i,
  /传销|庞氏|资金盘/i,
];

// ========== 违禁词替换建议 ==========
export const FORBIDDEN_REPLACEMENTS: Record<string, string> = {
  '最好': '优质',
  '第一': '领先',
  '顶级': '高端',
  '绝对': '非常',
  '100%': '极高的',
  '永久': '长期',
  '最佳': '优秀',
  '最强': '强大',
  '最低': '实惠',
  '最高': '高端',
  '独家': '独特',
  '唯一': '独特',
};

// ========== 通用扩写素材 ==========
export const GENERIC_EXPANSIONS: string[] = [
  '这背后有着深刻的原因和逻辑。',
  '深入了解后你会发现更多有趣的细节。',
  '这个问题值得我们深入思考和探讨。',
  '从多个角度来看，这都是一个值得关注的话题。',
  '这是一个复杂而有趣的现象。',
  '从历史发展的角度来看，这很有意义。',
];

export const SUMMARIES: string[] = [
  '综合来看，这种分析非常有道理。',
  '从历史角度来说，这样的观点很有见地。',
  '所以，我们应该用更全面的视角来看待这个问题。',
  '这值得我们每个人深思。',
  '希望这些信息对你有所帮助。',
];
