"""
文案润色服务 - 混合引擎版本
规则引擎 + 模板 + LLM（可选）
"""
import re
import random
import json
import sys

class PolishEngine:
    def __init__(self):
        # 违禁词库
        self.forbidden_words = [
            '最好', '第一', '顶级', '绝对', '100%', '永久',
            '国家级', '最高级', '最佳', '最强', '最低', '最高',
            '独家', '唯一', '全网最低', '仅此一家',
        ]
        
        # 敏感题材
        self.sensitive_patterns = [
            r'赌博|博彩|彩票预测',
            r'色情|裸体|性服务',
            r'枪支|弹药|爆炸物',
            r'毒品|大麻|冰毒',
            r'传销|庞氏|资金盘',
        ]
        
        # 口语化替换
        self.casual_map = {
            '是': '就是', '有': '有着', '可以': '能够',
            '非常': '超级', '很好': '很棒', '提供': '带来',
            '包含': '有着', '实现': '达到', '使用': '用',
            '进行': '做', '因为': '因为说', '所以': '所以呢',
            '但是': '不过', '然而': '但是呢', '虽然': '虽说',
            '认为': '觉得', '发现': '发现说', '需要': '得',
            '重要': '关键', '可能': '说不定', '已经': '早就',
        }
        
        # 故事化开头
        self.story_openers = [
            '你知道吗？', '说起来你可能不信，', '有个有趣的事：',
            '让我告诉你一个秘密：', '你有没有想过，', '话说，',
            '告诉你一个真相：', '其实呢，', '很多人都不知道，',
        ]
        
        # 带货风格
        self.sales_map = {
            '是': '绝对是', '有': '足足有', '好': '超赞',
            '可以': '轻松', '提供': '给你满满的', '完美': '绝了',
            '不错': '太棒了', '很好': '超级好',
        }
        
        # 扩写素材库
        self.expand_facts = {
            '碳水': ['碳水化合物是身体的主要能量来源，占每日热量的50-60%', 
                    '优质碳水能提供持久能量，避免血糖波动',
                    '全谷物碳水富含B族维生素，有助于新陈代谢'],
            '蛋白': ['蛋白质是肌肉生长和修复的关键营养素',
                    '每天需要摄入体重(kg)×1.2-1.5克蛋白质',
                    '优质蛋白来源包括肉、蛋、奶、豆类'],
            '纤维': ['膳食纤维促进肠道健康，预防便秘',
                    '每天需要25-35克膳食纤维',
                    '蔬菜水果是膳食纤维的最佳来源'],
            '脂肪': ['适量脂肪有助于脂溶性维生素吸收',
                    '不饱和脂肪酸对心血管健康有益',
                    '坚果、鱼类富含健康脂肪'],
            '维生素': ['维生素是维持生命活动必需的有机化合物',
                     '维生素C有助于增强免疫力',
                     '维生素D促进钙吸收，保护骨骼健康'],
        }
    
    def casual_rewrite(self, text):
        """口语化改写"""
        result = text
        for old, new in self.casual_map.items():
            if old in result:
                result = result.replace(old, new, 1)
        return result
    
    def storytelling_rewrite(self, text):
        """故事化改写"""
        opener = random.choice(self.story_openers)
        return opener + text
    
    def sales_rewrite(self, text):
        """带货风格改写"""
        result = text
        for old, new in self.sales_map.items():
            if old in result:
                result = result.replace(old, new, 1)
        return result + ' 赶紧试试吧！'
    
    def educational_rewrite(self, text):
        """知识讲解风格"""
        return '【科普】' + text + ' 从科学角度来看，这是非常合理的。'
    
    def expand_text(self, text, target_ratio=1.5):
        """扩写 - 根据关键词添加相关内容"""
        sentences = re.split(r'([。！？；])', text)
        
        expanded = []
        for i, s in enumerate(sentences):
            if s in '。！？；':
                expanded.append(s)
                continue
            
            expanded.append(s)
            
            # 根据关键词添加事实
            for key, facts in self.expand_facts.items():
                if key in s:
                    fact = random.choice(facts)
                    expanded.append('，' + fact)
                    break
        
        result = ''.join(expanded)
        
        # 如果还不够长，添加总结
        if len(result) < len(text) * target_ratio:
            result += ' 综合来看，这种搭配非常科学合理。'
        
        return result
    
    def condense_text(self, text):
        """精简 - 保留核心信息"""
        sentences = re.split(r'[。！？；]', text)
        sentences = [s.strip() for s in sentences if len(s) > 8]
        
        if len(sentences) <= 2:
            return text
        
        # 保留前2-3句
        return '。'.join(sentences[:3]) + '。'
    
    def check_compliance(self, text):
        """合规检查"""
        issues = []
        
        # 违禁词检查
        for word in self.forbidden_words:
            if word in text:
                issues.append({
                    'type': 'forbidden_word',
                    'word': word,
                    'suggestion': f'删除或替换「{word}」',
                    'severity': 'high'
                })
        
        # 敏感题材检查
        for pattern in self.sensitive_patterns:
            match = re.search(pattern, text)
            if match:
                issues.append({
                    'type': 'sensitive_topic',
                    'word': match.group(),
                    'suggestion': f'涉及敏感题材「{match.group()}」，建议删除',
                    'severity': 'high'
                })
        
        score = max(0, 100 - len(issues) * 15)
        return {'score': score, 'issues': issues, 'passed': len(issues) == 0}
    
    def calculate_originality(self, original, versions):
        """计算原创度"""
        if not versions:
            return 0
        
        # 简单的字符差异计算
        def char_diff(a, b):
            set_a = set(a)
            set_b = set(b)
            if not set_a or not set_b:
                return 0
            intersection = len(set_a & set_b)
            union = len(set_a | set_b)
            return 1 - (intersection / union)
        
        diffs = [char_diff(original, v) for v in versions]
        avg_diff = sum(diffs) / len(diffs)
        return round(avg_diff * 100)
    
    def fix_compliance(self, text, issues):
        """修复合规问题"""
        result = text
        for issue in issues:
            if issue['type'] == 'forbidden_word':
                # 替换违禁词
                word = issue['word']
                replacements = {
                    '最好': '优质', '第一': '领先', '顶级': '高端',
                    '绝对': '非常', '100%': '极高的', '永久': '长期',
                    '最佳': '优秀', '最强': '强大', '最低': '实惠',
                    '最高': '高端', '独家': '独特', '唯一': '独特',
                }
                if word in replacements:
                    result = result.replace(word, replacements[word])
        
        return result
    
    def polish(self, text, style='casual', mode='rewrite'):
        """主润色函数"""
        # 1. 根据模式和风格生成文案
        if mode == 'expand':
            polished = self.expand_text(text)
        elif mode == 'condense':
            polished = self.condense_text(text)
        else:  # rewrite
            if style == 'casual':
                polished = self.casual_rewrite(text)
            elif style == 'storytelling':
                polished = self.storytelling_rewrite(text)
            elif style == 'sales':
                polished = self.sales_rewrite(text)
            elif style == 'educational':
                polished = self.educational_rewrite(text)
            else:
                polished = text
        
        # 2. 生成多版本
        versions = [polished]
        alt_styles = ['casual', 'storytelling', 'sales', 'educational']
        alt_styles.remove(style)
        for alt_style in alt_styles[:2]:
            if mode == 'rewrite':
                if alt_style == 'casual':
                    versions.append(self.casual_rewrite(text))
                elif alt_style == 'storytelling':
                    versions.append(self.storytelling_rewrite(text))
                elif alt_style == 'sales':
                    versions.append(self.sales_rewrite(text))
            else:
                versions.append(polished)
        
        # 3. 合规检查
        compliance = self.check_compliance(polished)
        
        # 4. 修复合规问题
        if compliance['issues']:
            polished = self.fix_compliance(polished, compliance['issues'])
            versions[0] = polished
        
        # 5. 计算原创度
        originality = self.calculate_originality(text, versions)
        
        return {
            'polished': polished,
            'versions': versions,
            'compliance': compliance,
            'originality': originality
        }

# 测试
if __name__ == '__main__':
    engine = PolishEngine()
    
    text = "汉堡是最完美的快餐食品。它由面包提供碳水化合物，肉饼提供蛋白质，蔬菜提供膳食纤维。"
    
    print("=== 混合引擎测试 ===\n")
    
    for style in ['casual', 'storytelling', 'sales', 'educational']:
        for mode in ['rewrite', 'expand', 'condense']:
            result = engine.polish(text, style, mode)
            polished = result['polished']
            print(f"{style}/{mode} ({len(polished)}字): {polished[:60]}...")
