// ============================================
// 受控爬虫模块（默认关闭）
// 20个内置源 + 二次测试通过才启用
// ============================================

import fs from 'fs';
import path from 'path';
import { addCandidates } from './material-store';

const DATA_DIR = path.join(process.cwd(), 'data');
const CRAWLER_CONFIG_PATH = path.join(DATA_DIR, 'crawler_config.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export interface CrawlerSource {
  id: string;
  name: string;
  url: string;
  type: 'api' | 'page' | 'rss';
  status: 'untested' | 'testing' | 'passed' | 'failed';
  testCount: number;
  lastTest?: string;
  lastFetch?: string;
  fetchCount: number;
  enabled: boolean;
}

export interface CrawlerConfig {
  enabled: boolean;         // 全局开关，默认 false
  showWarning: boolean;     // 是否显示风险提示
  maxFetchPerRun: number;   // 单次最大抓取数
  cooldownMinutes: number;  // 冷却时间（分钟）
  lastFetchTime?: string;
  sources: CrawlerSource[];
}

// ========== 20个内置话术源 ==========
const BUILTIN_SOURCES: Omit<CrawlerSource, 'status' | 'testCount' | 'fetchCount' | 'enabled'>[] = [
  { id: 'jhwas_com', name: '话术网', url: 'https://www.jhwas.com', type: 'page' },
  { id: 'wenangou_com', name: '文案狗', url: 'https://www.wenangou.com', type: 'page' },
  { id: 'wenanquan_com', name: '文案圈', url: 'https://www.wenanquan.com', type: 'page' },
  { id: 'jin10_com', name: '金十数据', url: 'https://www.jin10.com', type: 'page' },
  { id: '36kr_com', name: '36氪', url: 'https://www.36kr.com', type: 'rss' },
  { id: 'sspai_com', name: '少数派', url: 'https://sspai.com', type: 'rss' },
  { id: 'zhihu_hot', name: '知乎热榜', url: 'https://www.zhihu.com/hot', type: 'page' },
  { id: 'weibo_hot', name: '微博热搜', url: 'https://s.weibo.com/top/summary', type: 'page' },
  { id: 'douyin_hot', name: '抖音热榜', url: 'https://www.douyin.com/hot', type: 'page' },
  { id: 'xiaohongshu_hot', name: '小红书热门', url: 'https://www.xiaohongshu.com', type: 'page' },
  { id: 'bilibili_hot', name: 'B站热门', url: 'https://www.bilibili.com/v/popular/rank/all', type: 'page' },
  { id: 'toutiao_hot', name: '头条热榜', url: 'https://www.toutiao.com', type: 'page' },
  { id: 'kuaishou_hot', name: '快手热榜', url: 'https://www.kuaishou.com', type: 'page' },
  { id: 'sohu_news', name: '搜狐新闻', url: 'https://www.sohu.com', type: 'rss' },
  { id: 'sina_news', name: '新浪新闻', url: 'https://news.sina.com.cn', type: 'page' },
  { id: '163_news', name: '网易新闻', url: 'https://news.163.com', type: 'page' },
  { id: 'people_news', name: '人民网', url: 'http://www.people.com.cn', type: 'rss' },
  { id: 'xinhua_news', name: '新华网', url: 'http://www.xinhuanet.com', type: 'rss' },
  { id: 'thepaper_news', name: '澎湃新闻', url: 'https://www.thepaper.cn', type: 'page' },
  { id: 'jiemian_news', name: '界面新闻', url: 'https://www.jiemian.com', type: 'page' },
];

function loadConfig(): CrawlerConfig {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(CRAWLER_CONFIG_PATH)) {
    const init: CrawlerConfig = {
      enabled: false,
      showWarning: true,
      maxFetchPerRun: 20,
      cooldownMinutes: 30,
      sources: BUILTIN_SOURCES.map(s => ({
        ...s,
        status: 'untested',
        testCount: 0,
        fetchCount: 0,
        enabled: false,
      })),
    };
    fs.writeFileSync(CRAWLER_CONFIG_PATH, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
  return JSON.parse(fs.readFileSync(CRAWLER_CONFIG_PATH, 'utf-8'));
}

function saveConfig(cfg: CrawlerConfig) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(CRAWLER_CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}

/** 获取爬虫配置（前端展示用） */
export function getCrawlerConfig(): CrawlerConfig {
  return loadConfig();
}

/** 开启/关闭爬虫全局开关 */
export function setCrawlerEnabled(enabled: boolean): CrawlerConfig {
  const cfg = loadConfig();
  cfg.enabled = enabled;
  saveConfig(cfg);
  return cfg;
}

/** 测试单个源（二次通过才算 passed） */
export async function testSource(sourceId: string): Promise<{ success: boolean; message: string }> {
  const cfg = loadConfig();
  const source = cfg.sources.find(s => s.id === sourceId);
  if (!source) return { success: false, message: '源不存在' };

  source.status = 'testing';
  saveConfig(cfg);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(source.url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeout);

    if (!res.ok) {
      source.testCount++;
      source.status = 'failed';
      source.lastTest = new Date().toISOString();
      saveConfig(cfg);
      return { success: false, message: `HTTP ${res.status}` };
    }

    source.testCount++;
    source.lastTest = new Date().toISOString();

    if (source.testCount >= 2) {
      source.status = 'passed';
      source.enabled = true;
    } else {
      source.status = 'untested'; // 还需要再测一次
    }

    saveConfig(cfg);
    return { success: true, message: `测试通过 (${source.testCount}/2)` };
  } catch (e) {
    source.testCount++;
    source.status = 'failed';
    source.lastTest = new Date().toISOString();
    saveConfig(cfg);
    return { success: false, message: String(e) };
  }
}

/** 从已通过测试的源抓取素材（简化版，实际需要解析HTML） */
export async function fetchFromSource(sourceId: string): Promise<{ success: number; failed: number }> {
  const cfg = loadConfig();
  if (!cfg.enabled) return { success: 0, failed: 0 };

  const source = cfg.sources.find(s => s.id === sourceId && s.enabled);
  if (!source) return { success: 0, failed: 0 };

  // 冷却检查
  if (cfg.lastFetchTime) {
    const elapsed = (Date.now() - new Date(cfg.lastFetchTime).getTime()) / 60000;
    if (elapsed < cfg.cooldownMinutes) return { success: 0, failed: 0 };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(source.url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timeout);

    if (!res.ok) return { success: 0, failed: 1 };

    const html = await res.text();
    // 简单提取中文句子
    const sentences = html.match(/[\u4e00-\u9fa5]{10,100}[。！？!?]/g) || [];
    const unique = [...new Set(sentences)].slice(0, cfg.maxFetchPerRun);

    if (unique.length > 0) {
      addCandidates(unique, 'crawler');
    }

    source.lastFetch = new Date().toISOString();
    source.fetchCount += unique.length;
    cfg.lastFetchTime = new Date().toISOString();
    saveConfig(cfg);

    return { success: unique.length, failed: 0 };
  } catch {
    return { success: 0, failed: 1 };
  }
}
