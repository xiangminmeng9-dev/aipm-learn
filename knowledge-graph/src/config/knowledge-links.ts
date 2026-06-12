import type { LinkData } from '../types';

/**
 * AI PM 知识系统概念连接（超越前置关系的概念关联）
 * 从原 KnowledgeGraph.tsx 迁移
 */
export const KNOWLEDGE_LINKS: LinkData[] = [
  // 基础 → 核心
  { source: 'ai-basics', target: 'llm-tech' },
  { source: 'ai-basics', target: 'product-thinking' },
  { source: 'ai-basics', target: 'data-analysis' },
  // 核心 → 进阶
  { source: 'llm-tech', target: 'ai-eval' },
  { source: 'product-thinking', target: 'ab-testing' },
  { source: 'product-thinking', target: 'ai-design' },
  { source: 'data-analysis', target: 'ai-eval' },
  { source: 'data-analysis', target: 'algo-collab' },
  { source: 'llm-tech', target: 'algo-collab' },
  // 进阶 → 实战
  { source: 'ai-eval', target: 'ai-strategy' },
  { source: 'ab-testing', target: 'ai-strategy' },
  { source: 'ai-design', target: 'ai-strategy' },
  { source: 'algo-collab', target: 'ai-strategy' },
  // 跨层关联
  { source: 'llm-tech', target: 'ai-eval' },
  { source: 'product-thinking', target: 'ab-testing' },
  { source: 'algo-collab', target: 'ai-design' },
];

/** 需要从图谱中过滤掉的虚拟模块 */
export const EXCLUDED_IDS = new Set(['__jd_gaps__', '__bookmarked_tech__']);
