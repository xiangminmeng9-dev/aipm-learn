import type { ExternalResource } from '@/types';

export const TYPE_CONFIG = [
  { value: 'link' as const, label: '链接', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '🔗' },
  { value: 'video' as const, label: '视频', color: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]/10', icon: '🎬' },
  { value: 'doc' as const, label: '文档', color: 'text-[#34c759]', bg: 'bg-[#34c759]/10', icon: '📄' },
];

export const TYPE_COLORS: Record<string, string> = {
  link: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  video: 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20',
  doc: 'bg-[#34c759]/10 text-[#34c759] border-[#34c759]/20',
  folder: 'bg-amber-50 text-amber-600 border-amber-200',
};

export const TYPE_ICONS: Record<string, string> = { link: '🔗', video: '🎬', doc: '📄', folder: '📁' };

export const CHART_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#F97316'];

export const TYPE_LABELS: Record<string, string> = { link: '链接', video: '视频', doc: '文档', folder: '文件夹' };

export interface ResourceTemplate {
  title: string;
  url: string;
  type: 'link' | 'video' | 'doc';
  source: string;
}

export interface AIPMDirection {
  id: string;
  label: string;
  icon: string;
  description: string;
  templates: ResourceTemplate[];
}

export const AI_PM_DIRECTIONS: AIPMDirection[] = [
  {
    id: 'ai-product-thinking',
    label: 'AI 产品思维',
    icon: '🧠',
    description: 'AI PM 核心思维框架与方法论',
    templates: [
      { title: 'AI 产品经理能力模型详解', url: 'https://zhuanlan.zhihu.com/p/ai-pm-competency-model', type: 'link', source: '知乎' },
      { title: '如何用 AI 重构产品体验', url: 'https://36kr.com/p/ai-rebuild-product', type: 'link', source: '36氪' },
      { title: 'AI Native 产品设计原则', url: 'https://www.bilibili.com/video/ai-native-design', type: 'video', source: 'B站' },
    ],
  },
  {
    id: 'technical-understanding',
    label: '技术理解力',
    icon: '⚙️',
    description: 'ML/DL 基础、LLM 原理与技术架构',
    templates: [
      { title: '吴恩达机器学习课程', url: 'https://www.coursera.org/learn/machine-learning', type: 'video', source: 'Coursera' },
      { title: 'Attention Is All You Need 论文', url: 'https://arxiv.org/abs/1706.03762', type: 'doc', source: 'arxiv' },
      { title: 'Transformer 架构图解', url: 'https://jalammar.github.io/illustrated-transformer/', type: 'link', source: 'Jay Alammar' },
    ],
  },
  {
    id: 'data-analysis',
    label: '数据分析',
    icon: '📊',
    description: 'SQL、A/B 测试、指标体系',
    templates: [
      { title: 'SQL 面试题大全', url: 'https://leetcode.cn/problemset/database/', type: 'doc', source: 'LeetCode' },
      { title: 'A/B 测试实战指南', url: 'https://zhuanlan.zhihu.com/p/ab-testing-guide', type: 'link', source: '知乎' },
      { title: '数据指标体系搭建方法', url: 'https://www.bilibili.com/video/metrics-system', type: 'video', source: 'B站' },
    ],
  },
  {
    id: 'user-research',
    label: '用户研究',
    icon: '👥',
    description: '用户访谈、问卷设计、需求洞察',
    templates: [
      { title: '用户访谈方法论', url: 'https://www.nngroup.com/articles/user-interviews/', type: 'link', source: 'NNG' },
      { title: '问卷设计与数据分析', url: 'https://zhuanlan.zhihu.com/p/survey-design', type: 'doc', source: '知乎' },
    ],
  },
  {
    id: 'business-thinking',
    label: '商业思维',
    icon: '💰',
    description: '商业模式、竞品分析、市场洞察',
    templates: [
      { title: '商业模式画布实战', url: 'https://strategyzer.com/canvas/business-model-canvas', type: 'link', source: 'Strategyzer' },
      { title: '竞品分析框架与方法', url: 'https://www.woshipm.com/competitive-analysis', type: 'doc', source: '人人都是PM' },
    ],
  },
  {
    id: 'communication',
    label: '沟通协作',
    icon: '🤝',
    description: 'Stakeholder 管理、汇报演示、跨团队协作',
    templates: [
      { title: '向上管理与 Stakeholder 沟通', url: 'https://zhuanlan.zhihu.com/p/stakeholder-management', type: 'link', source: '知乎' },
      { title: '高效汇报与演示技巧', url: 'https://www.bilibili.com/video/presentation-skills', type: 'video', source: 'B站' },
    ],
  },
];
