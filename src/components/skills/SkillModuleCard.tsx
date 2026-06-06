'use client';

import Link from 'next/link';
import type { SkillModuleWithProgress } from '@/types';
import { SKILL_MODULE_TO_LEARNING_MAP } from '@/components/resources/constants';

interface SkillModuleCardProps {
  module: SkillModuleWithProgress & { is_custom?: boolean };
  onClick: () => void;
  onDelete?: () => void;
}

const MAP_NODE_NAMES: Record<string, string> = {
  'pm-thinking': '产品思维模型', 'user-research': '用户研究', 'product-design': 'AI产品设计',
  'ai-commercialization': 'AI商业化', 'pm-capability': 'AI PM能力模型', 'ai-fundamentals': 'AI技术基础',
  'prompt-engineering': 'Prompt工程', 'ai-architecture': 'AI系统架构', 'ai-workflow': 'AI工作流',
  'conversational-ai': '对话式AI', 'data-metrics': '指标体系', 'ai-evaluation': 'AI效果评估',
  'product-strategy': '产品战略', 'ai-leadership': 'AI领导力', 'job-preparation': '求职备战',
  'rag-architecture': 'RAG架构', 'ai-agent-design': 'Agent设计', 'data-quality-annotation': '数据标注',
  'ai-requirement-spec': '需求规格', 'hitl-design': '人机协同', 'content-compliance': '合规审核',
  'cn-llm-ecosystem': '国产模型', 'badcase-analysis': 'Bad Case', 'ai-vendor-evaluation': '技术选型',
  'learning-resources': '学习资源',
};

export default function SkillModuleCard({ module, onClick, onDelete }: SkillModuleCardProps) {
  const isCustom = module.is_custom ?? false;

  return (
    <div
      className={`cursor-pointer rounded-2xl bg-card border p-5 transition-all hover:bg-secondary hover:border-border ${
        isCustom ? 'border-indigo-200' : 'border-border'
      }`}
      onClick={onClick}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{module.icon}</span>
          {isCustom && (
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-600">
              自定义
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
            {module.progress_percentage}%
          </span>
          {isCustom && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-[#ff3b30] transition-colors"
              title="删除模块"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{module.name}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{module.description}</p>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className="h-full rounded-full progress-gradient transition-all"
          style={{ width: `${module.progress_percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground">
        {module.completed_count}/{module.task_count} 任务
        {module.resource_count && module.resource_count > 0 && (
          <span className="ml-1 text-xs">· {module.resource_count} 资源</span>
        )}
      </span>
      {!isCustom && module.interview_weak_types && module.interview_weak_types.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          <span className="text-sm text-[#ff9500]">面试弱项</span>
          {module.interview_weak_types.map((type) => (
            <span key={type} className="rounded bg-[#ff9500]/10 px-1.5 py-0.5 text-sm text-[#ff9500]">
              {type}
            </span>
          ))}
        </div>
      )}
      {!isCustom && module.interview_methodology_count && module.interview_methodology_count > 0 && (
        <span className="mt-1 block text-sm text-muted-foreground">
          {module.interview_methodology_count} 条方法论
        </span>
      )}
      {!isCustom && (() => {
        const mapNodeSlug = module.slug ? SKILL_MODULE_TO_LEARNING_MAP[module.slug] : undefined;
        return mapNodeSlug ? (
          <Link
            href={`/skills/learning-map?node=${mapNodeSlug}`}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ {MAP_NODE_NAMES[mapNodeSlug] || mapNodeSlug}
          </Link>
        ) : null;
      })()}
    </div>
  );
}
