'use client';

import { useState } from 'react';
import { PROMPT_EXAMPLES, PROMPT_CATEGORIES, DIFFICULTY_CONFIG, type PromptExample } from '@/lib/coding/prompts-data';
import GradientBackground from '@/components/ui/gradient-background';

export default function CodingPromptsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = PROMPT_EXAMPLES.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = async (prompt: string, id: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <GradientBackground />
      {/* Header */}
      <div className="relative z-10 shrink-0 border-b border-border bg-card px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">AI Coding 提示词范例</h1>
        <p className="text-xs text-muted-foreground">精选完整项目级 AI Coding 提示词，覆盖系统设计、AI 应用、前后端开发等场景</p>
        <div className="mt-3">
          <input
            type="text"
            placeholder="搜索提示词、标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${!selectedCategory ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600'}`}
          >
            全部
          </button>
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${selectedCategory === cat.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
          <span className="mx-1 border-l border-border" />
          <button
            onClick={() => setSelectedDifficulty(null)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${!selectedDifficulty ? 'bg-gray-800 text-white' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
          >
            所有难度
          </button>
          {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setSelectedDifficulty(selectedDifficulty === key ? null : key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${selectedDifficulty === key ? `${cfg.bg} ${cfg.color} font-semibold` : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="mb-3 text-xs text-muted-foreground">共 {filtered.length} 个提示词</div>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">没有找到匹配的提示词</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                expanded={expandedId === prompt.id}
                onToggle={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                copied={copiedId === prompt.id}
                onCopy={() => handleCopy(prompt.prompt, prompt.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  expanded,
  onToggle,
  copied,
  onCopy,
}: {
  prompt: PromptExample;
  expanded: boolean;
  onToggle: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  const diff = DIFFICULTY_CONFIG[prompt.difficulty];
  const cat = PROMPT_CATEGORIES.find((c) => c.id === prompt.category);

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card transition hover:border-indigo-200 hover:shadow-sm">
      <div className="flex flex-1 flex-col p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{cat?.icon}</span>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-indigo-600 transition line-clamp-2">{prompt.title}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
          </div>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${diff.bg} ${diff.color}`}>{diff.label}</span>
        </div>

        {/* Tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {prompt.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">{tag}</span>
          ))}
          {prompt.source && (
            <span className="rounded bg-primary/5 px-1.5 py-0.5 text-xs text-primary">{prompt.source}</span>
          )}
        </div>

        {/* Expand toggle */}
        <button onClick={onToggle} className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition self-start">
          {expanded ? '收起 ▲' : '展开提示词 ▼'}
        </button>

        {/* Prompt content */}
        {expanded && (
          <div className="mt-3 relative">
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-800 p-3 text-xs leading-relaxed text-gray-200 max-h-[400px] overflow-y-auto">
              {prompt.prompt}
            </pre>
            <button
              onClick={onCopy}
              className="absolute right-2 top-2 rounded bg-white/10 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {copied ? '已复制 ✓' : '复制'}
            </button>
          </div>
        )}

        {/* Source link */}
        {prompt.sourceUrl && (
          <a href={prompt.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-muted-foreground hover:text-primary self-start">
            来源 ↗
          </a>
        )}
      </div>
    </div>
  );
}