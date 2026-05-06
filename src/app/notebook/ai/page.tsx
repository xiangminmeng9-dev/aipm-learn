'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Note, type Task, getNotes, getTasks } from '@/lib/notebook-store';

/* ---------------------------- Glass Button ---------------------------- */

function GlassButton({
  children,
  onClick,
  className = '',
  color = 'indigo',
  size = 'sm',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 border-indigo-200/60',
    rose: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 border-rose-200/60',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-emerald-200/60',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border-amber-200/60',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 border-purple-200/60',
    gray: 'bg-secondary hover:bg-gray-200/80 text-muted-foreground border-border',
  };
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-200 active:scale-95 ${colorMap[color] || colorMap.indigo} ${sizeClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------------------- Page ---------------------------- */

export default function AIAnalysisPage() {
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'both'>('both');

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis('');

    try {
      // Fetch notes and tasks
      const [{ notes }, { tasks }] = await Promise.all([
        getNotes(undefined),
        getTasks(new Date().toISOString().slice(0, 10)),
      ]);

      // Build context for AI analysis
      const notesContext = notes.length > 0
        ? notes.map((n: Note) => `[${n.category}] ${n.title}: ${n.content.slice(0, 200)}`).join('\n')
        : '暂无笔记';

      const tasksContext = tasks.length > 0
        ? tasks.map((t: Task) => `[${t.status}] ${t.title} (${t.duration || '无时长'}): ${t.description}`).join('\n')
        : '暂无任务';

      const prompt = buildAnalysisPrompt(notesContext, tasksContext, activeTab);

      // Call AI
      const res = await fetch('/api/notebook/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis || '分析完成，但未生成内容');
      } else {
        // Fallback: generate a local summary
        setAnalysis(generateLocalSummary(notes, tasks, activeTab));
      }
    } catch {
      // Generate local summary as fallback
      try {
        const [{ notes }, { tasks }] = await Promise.all([
          getNotes(undefined),
          getTasks(new Date().toISOString().slice(0, 10)),
        ]);
        setAnalysis(generateLocalSummary(notes, tasks, activeTab));
      } catch {
        setAnalysis('无法获取数据进行分析');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1677442136019-2022d5e1d84a?w=1200&q=80&auto=format')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-800/80 via-purple-700/60 to-fuchsia-800/70" />
        <div className="relative z-10 px-8 py-8">
          <h1 className="mb-1 text-2xl font-bold text-white">🧠 AI 智能分析</h1>
          <p className="text-sm text-white/70">对笔记和任务进行智能总结，发现洞察和优化建议</p>
        </div>
      </div>

      {/* Analysis controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">分析范围:</span>
          {(['both', 'notes', 'tasks'] as const).map((tab) => {
            const labels = { both: '📊 全部', notes: '📝 笔记', tasks: '✅ 任务' };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                  activeTab === tab ? 'bg-purple-500/15 text-purple-600 border-purple-200/60' : 'bg-muted text-muted-foreground border-border hover:bg-secondary'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
        <GlassButton onClick={runAnalysis} color="purple" size="md" disabled={isAnalyzing}>
          {isAnalyzing ? '分析中...' : '🧠 开始分析'}
        </GlassButton>
      </div>

      {/* Analysis result */}
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">AI 正在分析你的笔记和任务...</p>
          </motion.div>
        ) : analysis ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <p className="text-4xl mb-4">🧠</p>
            <p className="text-sm text-muted-foreground">点击「开始分析」获取 AI 对你笔记和任务的智能总结</p>
            <p className="mt-2 text-xs text-muted-foreground">分析内容包括：工作模式洞察、时间分配建议、优先级优化、风险预警</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------- Helpers ---------------------------- */

function buildAnalysisPrompt(notesContext: string, tasksContext: string, scope: 'notes' | 'tasks' | 'both'): string {
  const scopeDesc = { notes: '笔记', tasks: '每日任务', both: '笔记和每日任务' }[scope];
  return `你是一位资深的 AI 产品经理工作顾问。请基于以下${scopeDesc}数据，生成一份简洁实用的分析报告。

## 分析要求
1. **工作模式洞察**: 从笔记和任务中识别用户的工作模式和关注点
2. **时间分配建议**: 根据任务时长分析时间分配是否合理，给出优化建议
3. **优先级优化**: 建议哪些任务应该优先处理，哪些可以延后
4. **风险预警**: 识别可能遗漏的重要事项或潜在风险
5. **行动建议**: 给出 3-5 条具体可执行的建议

## 笔记数据
${scope !== 'tasks' ? notesContext : '（未包含）'}

## 今日任务数据
${scope !== 'notes' ? tasksContext : '（未包含）'}

请用 Markdown 格式输出，结构清晰，语言简洁专业。`;
}

function generateLocalSummary(notes: Note[], tasks: Task[], scope: 'notes' | 'tasks' | 'both'): string {
  const lines: string[] = [];
  lines.push('# 📊 工作分析报告\n');

  if (scope !== 'tasks' && notes.length > 0) {
    lines.push('## 📝 笔记概览\n');
    lines.push(`共 **${notes.length}** 条笔记\n`);
    const categories = Object.entries(
      notes.reduce<Record<string, number>>((acc, n) => { acc[n.category] = (acc[n.category] || 0) + 1; return acc; }, {})
    );
    lines.push('### 分类分布\n');
    categories.forEach(([cat, count]) => lines.push(`- **${cat}**: ${count} 条`));
    const pinned = notes.filter((n) => n.pinned);
    if (pinned.length) {
      lines.push('\n### 置顶笔记\n');
      pinned.forEach((n) => lines.push(`- **${n.title}** (${n.category})`));
    }
  }

  if (scope !== 'notes' && tasks.length > 0) {
    lines.push('\n## ✅ 任务概览\n');
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    lines.push(`共 **${tasks.length}** 个任务：已完成 ${done}，进行中 ${inProgress}，待办 ${todo}\n`);

    const totalMin = tasks.reduce((sum, t) => {
      if (!t.duration) return sum;
      const m = t.duration.match(/^(\d+\.?\d*)\s*(min|h)$/);
      if (!m) return sum;
      return sum + (m[2] === 'h' ? parseFloat(m[1]) * 60 : parseFloat(m[1]));
    }, 0);
    if (totalMin > 0) {
      lines.push(`### 时间分配\n`);
      lines.push(`总预计时长: **${totalMin >= 60 ? `${(totalMin / 60).toFixed(1)}h` : `${Math.round(totalMin)}min`}**\n`);
    }

    if (inProgress > 0) {
      lines.push('### 进行中的任务\n');
      tasks.filter((t) => t.status === 'in_progress').forEach((t) => lines.push(`- 🔄 **${t.title}** ${t.duration ? `(${t.duration})` : ''}`));
    }
  }

  lines.push('\n## 💡 建议\n');
  lines.push('- 登录后可使用 AI 深度分析功能，获取个性化工作建议');
  lines.push('- 定期回顾笔记，提炼可复用的方法论');
  lines.push('- 为重要任务设置合理时长，避免时间分配失衡');

  return lines.join('\n');
}
