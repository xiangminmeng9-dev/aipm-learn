'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState, useRef, useCallback } from 'react';
import { useInView } from 'framer-motion';
import { MotionDiv, MotionButton, AnimatePresence } from '@/components/ui/lazy-motion';
import UserMenu from '@/components/layout/UserMenu';

/* ---------------------------- Data ---------------------------- */

interface SubFeature {
  label: string;
  href: string;
}

interface BookItem {
  id: string;
  title: string;
  titleEn: string;
  label: string;
  description: string;
  detail: string;
  href: string;
  theme: 'coding' | 'skills' | 'notebook' | 'interview' | 'resume' | 'resources' | 'simulator' | 'daily-challenge';
  subFeatures: SubFeature[];
}

const topShelf: BookItem[] = [
  {
    id: 'coding',
    title: 'Coding',
    titleEn: 'AI Coding',
    label: 'AI Coding 练习',
    description: '开发流程生成 · 实操练习 · 提示词范例 · 历史记录 · 方法论提炼',
    detail:
      'AI Coding 练习模块帮助你掌握 AI 辅助开发的完整流程。通过生成开发流程、实操练习编写 Spec、浏览全网提示词范例、记录历史操作、提炼方法论和范式对比，让你在 AI 时代成为更高效的工程师。',
    href: '/coding/dashboard',
    theme: 'coding',
    subFeatures: [
      { label: '数据看板', href: '/coding/dashboard' },
      { label: '开发流程生成', href: '/coding/practice' },
      { label: '实操练习', href: '/coding/spec-practice' },
      { label: '实操历史', href: '/coding/spec-history' },
      { label: '提示词范例', href: '/coding/prompts' },
      { label: '历史记录', href: '/coding/flows' },
      { label: '方法论提炼', href: '/coding/methodology' },
    ],
  },
  {
    id: 'skills',
    title: 'Skills',
    titleEn: 'Skill Tree',
    label: 'AI PM 技能学习',
    description: '技能树总览 · 岗位分析 · 学习路径 · AI学习路径 · JD差距分析 · 收藏技术',
    detail:
      '技能树模块提供系统化的 AI PM 技能学习路径。通过可视化技能树、岗位 JD 分析、学习路径规划、AI 弱项分析学习路径、JD 差距分析和收藏技术，精准定位技能差距，高效提升核心竞争力。',
    href: '/skills/dashboard',
    theme: 'skills',
    subFeatures: [
      { label: '数据看板', href: '/skills/dashboard' },
      { label: '技能树总览', href: '/skills/tree' },
      { label: '岗位分析', href: '/skills/jd-analysis' },
      { label: '学习路径', href: '/skills/learning-path' },
      { label: 'AI 学习路径', href: '/skills/ai-learning-path' },
      { label: '路径历史', href: '/skills/path-history' },
      { label: 'JD差距分析', href: '/skills/jd-gaps' },
      { label: 'Prompt练习', href: '/skills/prompt-practice' },
      { label: '收藏技术', href: '/skills/bookmarked-tech' },
    ],
  },
  {
    id: 'notebook',
    title: 'Notebook',
    titleEn: 'AI PM Notebook',
    label: 'AI PM 笔记本',
    description: '问题记录 · 待办事项 · 每日任务 · 模板速建',
    detail:
      'AI PM 笔记本帮助你记录工作中遇到的问题和洞察，管理待办事项，管理每日任务，并提供大厂 AI PM 每日工作模板快速生成任务。',
    href: '/notebook',
    theme: 'notebook',
    subFeatures: [
      { label: '数据看板', href: '/notebook/dashboard' },
      { label: '笔记', href: '/notebook/notes' },
      { label: '待办事项', href: '/notebook/todos' },
      { label: '每日任务', href: '/notebook/tasks' },
      { label: 'AI 分析', href: '/notebook/ai' },
    ],
  },
  {
    id: 'simulator',
    title: 'Simulator',
    titleEn: 'AI PM Simulator',
    label: 'AI PM 模拟工作流',
    description: '需求澄清 · 竞品分析 · 算法沟通 · 产品设计 · 评测验收 · 日报周报 · 1v1沟通 · 数据看板 · 项目实战沙盒',
    detail:
      'AI PM 模拟工作流程让你沉浸式体验大厂 AI 产品经理的日常。15 个核心阶段覆盖项目全流程和专项技能训练：从需求澄清、竞品分析到评测验收，再到日报周报、1v1 沟通、PRD 沙盒、数据看板、跨部门协作，每个阶段都有 AI 扮演的真实角色与你互动。项目实战沙盒让你在真实项目场景中综合运用所有技能。',
    href: '/simulator',
    theme: 'simulator',
    subFeatures: [
      { label: '数据看板', href: '/simulator/dashboard' },
      { label: '模拟工作流', href: '/simulator/workflow' },
      { label: '项目实战沙盒', href: '/simulator/project' },
      { label: 'Boss 1V1', href: '/simulator/boss-1v1' },
    ],
  },
];

const bottomShelf: BookItem[] = [
  {
    id: 'interview',
    title: 'Interview',
    titleEn: 'Interview',
    label: 'AI PM 面试助手',
    description: '面试助手 · 面试问答 · 面试收藏 · 题库社区 · 面试技巧 · 模拟面试 · 竞品分析 · 方法论 · 练习统计',
    detail:
      'AI PM 面试助手覆盖面试全流程：AI 面试助手对话、智能问答、面试收藏夹、题库社区共享、面试技巧库、模拟面试、竞品分析、方法论提炼和练习统计。通过 AI 驱动的实战练习，让你在 PM 面试中脱颖而出。',
    href: '/interview/dashboard',
    theme: 'interview',
    subFeatures: [
      { label: '数据看板', href: '/interview/dashboard' },
      { label: '面试助手', href: '/interview/assistant' },
      { label: '面试问答', href: '/interview/qa' },
      { label: '面试收藏', href: '/interview/favorites' },
      { label: '题库社区', href: '/interview/community' },
      { label: '面试技巧', href: '/interview/tips' },
      { label: '模拟面试', href: '/interview/mock' },
      { label: '方法论', href: '/interview/methodology' },
      { label: '练习统计', href: '/interview/stats' },
      { label: '竞品分析', href: '/interview/competitive' },
      { label: '竞品历史', href: '/interview/comp-history' },
    ],
  },
  {
    id: 'resume',
    title: 'Resume',
    titleEn: 'Resume',
    label: '简历助手',
    description: 'AI 优化简历 · JD 匹配 · 多版本生成 · 投递追踪 · 数据看板',
    detail:
      '简历助手利用 AI 智能分析简历与目标岗位的匹配度，根据 STAR 方法优化项目经历，生成大厂风格/行业专属简历版本。简历仓库管理多版本简历，投递记录追踪面试进度，投递日历查看面试安排，数据看板分析投递效果，助你精准投递、高效拿 Offer。',
    href: '/resume/dashboard',
    theme: 'resume',
    subFeatures: [
      { label: '数据看板', href: '/resume/dashboard' },
      { label: '简历修改', href: '/resume' },
      { label: '简历仓库', href: '/resume/repository' },
      { label: '投递记录', href: '/resume/applications' },
      { label: '投递日历', href: '/resume/calendar' },
      { label: '历史版本', href: '/resume/versions' },
      { label: '职位推荐', href: '/resume/jobs' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    titleEn: 'Resources',
    label: '学习资源库',
    description: '数据看板 · 资源管理 · 每日AI大事 · AI技术动态',
    detail:
      '学习资源库提供可视化数据看板、资源管理、每日AI大事和AI技术动态四大模块。数据看板展示资源分布和增长趋势；每日AI大事自动收集各大平台 AI 动态并生成摘要；AI技术动态实时追踪技术发展并提供白话翻译；资源管理支持文件夹分类和 AI PM 学习方向快速创建。',
    href: '/resources',
    theme: 'resources',
    subFeatures: [
      { label: '数据看板', href: '/resources' },
      { label: '资源管理', href: '/resources/manage' },
      { label: '每日AI大事', href: '/resources/daily-ai-news' },
      { label: 'AI技术动态', href: '/resources/ai-tech' },
      { label: 'AI PM文章', href: '/resources/ai-pm-articles' },
    ],
  },
  {
    id: 'daily-challenge',
    title: 'Challenge',
    titleEn: 'Daily Challenge',
    label: '每日挑战',
    description: '每日场景题 · 知识闪卡 · 错题本 · 每日 AI 技术 · 打卡追踪',
    detail:
      '每日挑战帮你养成每天学习的好习惯。每天推送一道真实 AI PM 场景题，限时作答后 AI 评分并给出改进建议；知识闪卡用间隔重复算法帮你高效记忆 AI PM 核心知识；错题本自动分类低分题目支持重做；每日 AI 技术用白话解读一个 AI 技术知识点；连续打卡追踪激励你持续进步。',
    href: '/daily-challenge/dashboard',
    theme: 'daily-challenge',
    subFeatures: [
      { label: '数据看板', href: '/daily-challenge/dashboard' },
      { label: '今日挑战', href: '/daily-challenge' },
      { label: '答题记录', href: '/daily-challenge/history' },
      { label: '知识闪卡', href: '/daily-challenge/flashcards' },
      { label: '错题本', href: '/daily-challenge/wrong' },
      { label: '每日 AI 技术', href: '/daily-challenge/tech' },
    ],
  },
];

const allBooks = [...topShelf, ...bottomShelf];

/* ---------------------------- Cover Art (per-theme SVG) ---------------------------- */

function CoverArt({ theme }: { theme: BookItem['theme'] }) {
  switch (theme) {
    case 'coding':
      // Cyberpunk grid + neon brackets
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%, #020617 100%)' }}>
          <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="codeGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 16} x2="200" y2={i * 16} stroke="url(#codeGlow)" strokeWidth="0.3" />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 16} y1="0" x2={i * 16} y2="200" stroke="url(#codeGlow)" strokeWidth="0.3" />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-mono text-[60px] font-black tracking-tighter text-transparent" style={{ WebkitTextStroke: '2px #22d3ee', filter: 'drop-shadow(0 0 16px rgba(34,211,238,0.8))' }}>
              {'</>'}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 font-mono text-[8px] leading-tight text-cyan-300/60">
            <div>$ ai-coding init</div>
            <div className="text-cyan-300/40">→ generating flow...</div>
          </div>
        </div>
      );
    case 'skills':
      // Tree of skills, retro pastel
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)' }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <line x1="100" y1="180" x2="100" y2="80" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
            <line x1="100" y1="120" x2="60" y2="80" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="120" x2="140" y2="80" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="100" x2="70" y2="60" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            <line x1="100" y1="100" x2="130" y2="60" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            {[
              { cx: 100, cy: 80, r: 14, fill: '#dc2626' },
              { cx: 60, cy: 80, r: 11, fill: '#ea580c' },
              { cx: 140, cy: 80, r: 11, fill: '#16a34a' },
              { cx: 70, cy: 60, r: 9, fill: '#0891b2' },
              { cx: 130, cy: 60, r: 9, fill: '#7c3aed' },
              { cx: 100, cy: 50, r: 8, fill: '#db2777' },
            ].map((c, i) => (
              <circle key={i} {...c} stroke="#fff" strokeWidth="2" />
            ))}
          </svg>
          <div className="absolute left-4 top-4 rounded-md bg-amber-900/80 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-100">Skill Tree v2</div>
        </div>
      );
    case 'notebook':
      // Lined paper + ink doodle
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#fef9e7' }}>
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 22px, #f59e0b22 22px 23px)',
          }} />
          <div className="absolute left-4 top-0 bottom-0 w-px bg-rose-300/60" />
          <div className="absolute left-8 top-6 right-6 space-y-1 font-mono text-[11px] text-stone-700">
            <div className="font-bold">2026 · Week 16</div>
            <div className="text-stone-500">— problem #023</div>
            <div className="text-stone-500">— insight: AI North Star</div>
            <div className="text-stone-500">— meeting notes ✓</div>
          </div>
          <svg className="absolute bottom-4 right-4 h-16 w-16 text-emerald-600/70" viewBox="0 0 64 64" fill="none">
            <path d="M8 48 Q 20 12, 32 32 T 56 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="56" cy="24" r="3" fill="currentColor" />
          </svg>
        </div>
      );
    case 'interview':
      // Spotlight + speech bubbles
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 35%, #c026d3 100%)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.25), transparent 60%)' }} />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <rect x="20" y="50" rx="10" ry="10" width="100" height="40" fill="white" opacity="0.9" />
            <polygon points="35,90 30,100 50,90" fill="white" opacity="0.9" />
            <rect x="80" y="110" rx="10" ry="10" width="100" height="40" fill="#fbbf24" />
            <polygon points="170,150 175,160 155,150" fill="#fbbf24" />
            <text x="40" y="76" fontFamily="ui-sans-serif" fontSize="14" fontWeight="700" fill="#1e1b4b">Why?</text>
            <text x="100" y="136" fontFamily="ui-sans-serif" fontSize="14" fontWeight="700" fill="#1e1b4b">STAR.</text>
          </svg>
        </div>
      );
    case 'resume':
      // Document + gradient stamp
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #fb923c 0%, #f97316 60%, #ea580c 100%)' }}>
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-white shadow-2xl" style={{ transform: 'translate(-50%,-50%) rotate(-3deg)' }}>
            <div className="space-y-1.5 p-3">
              <div className="h-2 w-12 rounded-sm bg-stone-800" />
              <div className="h-1 w-20 rounded-sm bg-stone-300" />
              <div className="mt-2 h-px bg-stone-200" />
              <div className="h-1 w-full rounded-sm bg-stone-200" />
              <div className="h-1 w-5/6 rounded-sm bg-stone-200" />
              <div className="h-1 w-4/6 rounded-sm bg-stone-200" />
              <div className="mt-2 h-px bg-stone-200" />
              <div className="h-1 w-full rounded-sm bg-stone-200" />
              <div className="h-1 w-3/4 rounded-sm bg-stone-200" />
            </div>
          </div>
          <div className="absolute right-3 top-3 rotate-12 rounded-md border-2 border-rose-600 bg-white/90 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-rose-600">A+ FIT</div>
        </div>
      );
    case 'resources':
      // Bookshelf with bookmarks
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #dbeafe 0%, #93c5fd 50%, #3b82f6 100%)' }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            {/* Book spines */}
            <rect x="30" y="60" width="18" height="120" rx="2" fill="#dc2626" opacity="0.8" />
            <rect x="52" y="55" width="14" height="125" rx="2" fill="#16a34a" opacity="0.8" />
            <rect x="70" y="65" width="20" height="115" rx="2" fill="#7c3aed" opacity="0.8" />
            <rect x="94" y="50" width="16" height="130" rx="2" fill="#f59e0b" opacity="0.8" />
            <rect x="114" y="60" width="22" height="120" rx="2" fill="#0891b2" opacity="0.8" />
            <rect x="140" y="55" width="15" height="125" rx="2" fill="#db2777" opacity="0.8" />
            <rect x="159" y="62" width="18" height="118" rx="2" fill="#ea580c" opacity="0.8" />
            {/* Bookmark flags */}
            <polygon points="94,50 102,42 110,50" fill="#fbbf24" />
            <polygon points="70,65 78,57 86,65" fill="#fbbf24" />
          </svg>
          <div className="absolute left-4 top-4 rounded-md bg-blue-900/80 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-blue-100">My Library</div>
        </div>
      );
    case 'simulator':
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)' }}>
          <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            {[40, 80, 120, 160].map((y, i) => (
              <line key={i} x1="30" y1={y} x2="170" y2={y} stroke="white" strokeWidth="0.5" strokeDasharray="4 3" />
            ))}
            {[50, 90, 130].map((y, i) => (
              <circle key={`c${i}`} cx={50 + i * 50} cy={y} r="8" fill="white" opacity="0.6" />
            ))}
            <line x1="50" y1="58" x2="100" y2="82" stroke="white" strokeWidth="1.5" opacity="0.5" />
            <line x1="100" y1="98" x2="150" y2="122" stroke="white" strokeWidth="1.5" opacity="0.5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[56px]" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }}>🚀</div>
          </div>
          <div className="absolute left-4 top-4 rounded-md bg-teal-900/80 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-teal-100">Simulator</div>
          <div className="absolute bottom-4 left-4 right-4 font-mono text-[8px] leading-tight text-teal-100/60">
            <div>Stage 1 → 需求澄清</div>
            <div className="text-teal-100/40">Stage 2 → 竞品分析 ...</div>
          </div>
        </div>
      );
    case 'daily-challenge':
      return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #fde68a 100%)' }}>
          <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
            <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 3" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="100" y1="40" x2="100" y2="160" stroke="white" strokeWidth="0.5" />
            <line x1="40" y1="100" x2="160" y2="100" stroke="white" strokeWidth="0.5" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[56px]" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }}>🎯</div>
          </div>
          <div className="absolute left-4 top-4 rounded-md bg-amber-900/80 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-100">Daily</div>
          <div className="absolute bottom-4 left-4 right-4 font-mono text-[8px] leading-tight text-amber-100/60">
            <div>Day 1 → 场景挑战</div>
            <div className="text-amber-100/40">🃏 闪卡复习 ...</div>
          </div>
        </div>
      );
  }
}

/* ---------------------------- Detail Modal ---------------------------- */

function DetailModal({ book, onClose }: { book: BookItem; onClose: () => void }) {
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="relative h-56 w-full overflow-hidden">
          <CoverArt theme={book.theme} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h2 className="text-2xl font-extrabold text-white">{book.label}</h2>
            <p className="text-sm text-white/70">{book.titleEn}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{book.detail}</p>
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">功能模块</h3>
            <div className="flex flex-wrap gap-2">
              {book.subFeatures.map((sub) => (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                >
                  {sub.label}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href={book.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Open
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}

/* ---------------------------- Edition Card (Shopify-style) ---------------------------- */

const CARD_SIZE = '260px';

function EditionCard({
  book,
  index,
  highlighted,
  bouncing,
  onDetails,
}: {
  book: BookItem;
  index: number;
  highlighted: boolean;
  bouncing: boolean;
  onDetails: () => void;
}) {
  return (
    <MotionDiv
      id={`book-${book.id}`}
      initial={{ opacity: 0, y: 40 }}
      animate={{
        opacity: 1,
        y: 0,
        ...(bouncing ? { y: [0, -14, 0, -6, 0], transition: { duration: 0.55, ease: 'easeOut' } } : {}),
      }}
      transition={
        bouncing ? { duration: 0.55, ease: 'easeOut' } : { type: 'spring', stiffness: 120, damping: 18, delay: index * 0.08 }
      }
      whileHover={{ y: -8 }}
      className={`group relative will-change-transform ${highlighted ? 'z-10' : ''}`}
      style={{ width: CARD_SIZE }}
    >
      <div
        className={`relative cursor-pointer overflow-hidden rounded-[4px] transition-shadow duration-300 ${
          highlighted ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-background' : ''
        }`}
        style={{
          aspectRatio: '1 / 1',
          boxShadow: '0 12px 30px -8px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.08)',
        }}
      >
        {/* Cover */}
        <CoverArt theme={book.theme} />

        {/* Title overlay (always visible, subtle) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-0.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-12">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">{book.titleEn}</div>
          <div className="text-lg font-extrabold tracking-tight text-white drop-shadow">{book.label}</div>
        </div>

        {/* "NOW PLAYING" badge on highlighted card */}
        {highlighted && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600">Selected</span>
          </div>
        )}

        {/* Hover pill buttons */}
        <MotionDiv
          initial={false}
          className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-y-1"
        >
          <Link
            href={book.href}
            className="rounded-full bg-card px-5 py-1.5 text-xs font-bold text-foreground shadow-lg transition-transform hover:scale-105"
          >
            Open
          </Link>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDetails(); }}
            className="rounded-full bg-card px-5 py-1.5 text-xs font-bold text-foreground shadow-lg transition-transform hover:scale-105"
          >
            Details
          </button>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
}

/* ---------------------------- Floating Shelf ---------------------------- */

function FloatingShelf({
  books,
  shelfIndex,
  highlightedId,
  bouncingId,
  onDetails,
}: {
  books: BookItem[];
  shelfIndex: number;
  highlightedId: string | null;
  bouncingId: string | null;
  onDetails: (book: BookItem) => void;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="relative w-full max-w-[1200px]">
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-center gap-8 pb-5 md:gap-12"
      >
        {books.map((book, i) => (
          <EditionCard
            key={book.id}
            book={book}
            index={shelfIndex * 3 + i}
            highlighted={highlightedId === book.id}
            bouncing={bouncingId === book.id}
            onDetails={() => onDetails(book)}
          />
        ))}
      </MotionDiv>

      {/* Shelf plank */}
      <MotionDiv
        initial={{ scaleX: 0.3, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto h-[10px] rounded-[1px] dark:hidden"
        style={{
          width: '94%',
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 55%, #d4d4d6 100%)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, 0 -1px 0 rgba(0,0,0,0.05) inset, 0 18px 24px -12px rgba(0,0,0,0.22), 0 6px 10px -6px rgba(0,0,0,0.12)',
          transformOrigin: 'center',
        }}
      >
        {/* shelf front lip */}
        <div
          className="absolute inset-x-0 top-full h-[3px]"
          style={{ background: 'linear-gradient(180deg, #c2c2c5, #9a9a9d)' }}
        />
      </MotionDiv>
      {/* cast shadow under shelf */}
      <div
        className="mx-auto mt-1 h-3 rounded-[50%] dark:hidden"
        style={{
          width: '82%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.14) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

/* ---------------------------- Page ---------------------------- */

export default function HomePage() {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [detailBook, setDetailBook] = useState<BookItem | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleFooterHover = useCallback((id: string) => { setBouncingId(id); }, []);
  const handleFooterLeave = useCallback(() => { setBouncingId(null); }, []);

  const handleFooterClick = (id: string) => {
    setHighlightedId((prev) => (prev === id ? null : id));
    const el = document.getElementById(`book-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Wall texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35] dark:opacity-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.8) 0%, transparent 40%), radial-gradient(circle at 80% 60%, rgba(0,0,0,0.04) 0%, transparent 50%)',
        }}
      />

      {/* -- Nav -- */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div
          className="flex h-16 items-center justify-between px-4 md:px-0"
          style={{
            paddingLeft: 'max(16px, min(48px, calc((100vw - 1600px) / 2 + 48px)))',
            paddingRight: 'max(16px, min(16px, calc((100vw - 1600px) / 4 + 8px)))',
          }}
        >
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-foreground">AI PM 学习平台</Link>
          <div className="flex items-center gap-2">
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {allBooks.map((feature) => (
                <div key={feature.id} className="relative" onMouseEnter={() => setActiveDropdown(feature.id)} onMouseLeave={() => setActiveDropdown(null)}>
                  <Link href={feature.href} className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    {feature.title}
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                  </Link>
                  {activeDropdown === feature.id && (
                    <div className="absolute left-0 top-full pt-1">
                      <div className="w-48 rounded-xl border border-border bg-card py-2 shadow-lg">
                        {feature.subFeatures.map((sub) => (
                          <Link key={sub.href} href={sub.href} className="block px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400">{sub.label}</Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
            {/* Mobile hamburger */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary md:hidden"
              onClick={() => setActiveDropdown(activeDropdown === 'mobile-menu' ? null : 'mobile-menu')}
              aria-label="菜单"
              aria-expanded={activeDropdown === 'mobile-menu'}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {activeDropdown === 'mobile-menu'
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />}
              </svg>
            </button>
            <div className="ml-3 border-l border-border pl-3">
              <UserMenu />
            </div>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {activeDropdown === 'mobile-menu' && (
            <MotionDiv
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <nav className="grid grid-cols-2 gap-1 p-4">
                {allBooks.flatMap((feature) => [
                  <Link key={feature.id} href={feature.href} className="col-span-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground" onClick={() => setActiveDropdown(null)}>{feature.title}</Link>,
                  ...feature.subFeatures.map((sub) => (
                    <Link key={sub.href} href={sub.href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary" onClick={() => setActiveDropdown(null)}>{sub.label}</Link>
                  )),
                ])}
              </nav>
            </MotionDiv>
          )}
        </AnimatePresence>
      </header>

      {/* -- Main (Shopify Editions style) -- */}
      <main className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-12 md:pt-16">
        {/* Editorial intro (top-left, Shopify style) */}
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-10 w-full max-w-[1200px] px-2 md:mb-16"
        >
          <h1 className="text-[32px] font-medium leading-tight tracking-tight text-foreground md:text-[44px]">
            AI PM 学习平台
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Everything you need to become an AI PM.<br />Curated every season.
          </p>
        </MotionDiv>

        {/* Shelves */}
        <div className="flex w-full flex-col items-center gap-24 md:gap-28" suppressHydrationWarning>
          <FloatingShelf books={topShelf} shelfIndex={0} highlightedId={highlightedId} bouncingId={bouncingId} onDetails={setDetailBook} />
          <FloatingShelf books={bottomShelf} shelfIndex={1} highlightedId={highlightedId} bouncingId={bouncingId} onDetails={setDetailBook} />
        </div>

        {/* Timeline index (Shopify-style bottom strip) */}
        <div className="mt-20 w-full max-w-[1100px] border-t border-border pt-6">
          <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-3">
            {allBooks.map((b, i) => {
              const isActive = highlightedId === b.id;
              return (
                <MotionButton
                  key={b.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
                  onClick={() => handleFooterClick(b.id)}
                  onMouseEnter={() => handleFooterHover(b.id)}
                  onMouseLeave={handleFooterLeave}
                  className="group flex flex-col items-start text-left transition-colors"
                >
                  <span className={`text-[10px] font-medium tracking-wider transition-colors ${isActive ? 'text-indigo-600' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    2026 · {i < 3 ? 'Spring' : 'Summer'}
                  </span>
                  <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-indigo-700' : 'text-foreground group-hover:text-foreground'}`}>
                    {b.titleEn}
                  </span>
                </MotionButton>
              );
            })}
          </div>
        </div>
      </main>

      {/* -- Footer -- */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-6 py-6">
          <p className="text-center text-xs font-medium italic text-muted-foreground">
            Meng Xiangmin will definitely join a major internet company, and his life will surely be a success.
          </p>
        </div>
      </footer>

      <AnimatePresence>
        {detailBook && <DetailModal book={detailBook} onClose={() => setDetailBook(null)} />}
      </AnimatePresence>
    </div>
  );
}
