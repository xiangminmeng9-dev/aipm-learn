'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ResourcesStatsResponse } from '@/types';
import TypeDistributionChart from '@/components/resources/charts/TypeDistributionChart';
import SourceDistributionChart from '@/components/resources/charts/SourceDistributionChart';
import ActivityBarChart from '@/components/resources/charts/ActivityBarChart';
import GrowthTimelineChart from '@/components/resources/charts/GrowthTimelineChart';
import FolderTreemapChart from '@/components/resources/charts/FolderTreemapChart';

const navCards = [
  {
    title: '每日 AI 大事',
    description: 'AI 行业每日要闻，AI 生成摘要与趋势洞察',
    href: '/resources/daily-ai-news',
    icon: '📰',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'AI 技术动态',
    description: '追踪 RAG/Agent/LLM 技术路线与前沿实现',
    href: '/resources/ai-tech',
    icon: '⚡',
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'AI PM 文章',
    description: '精选 AI 产品经理技术文章，白话翻译助你理解',
    href: '/resources/ai-pm-articles',
    icon: '✨',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: '资源管理',
    description: '管理学习资源与文件夹',
    href: '/resources/manage',
    icon: '📁',
    color: 'from-purple-500 to-violet-600',
  },
];

const statCards = [
  { key: 'total_resources' as const, label: '收藏资源', icon: '📁' },
  { key: 'total_rss_articles' as const, label: 'RSS 文章', icon: '📰' },
  { key: 'total_daily_news' as const, label: '每日新闻', icon: '📡' },
  { key: 'total_rss_sources' as const, label: 'RSS 源', icon: '🔌' },
];

export default function ResourcesPage() {
  const [stats, setStats] = useState<ResourcesStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/resources/stats');
        if (res.ok) {
          setStats(await res.json());
        } else {
          setError('加载失败');
        }
      } catch {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-[#6B7280]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#F8F9FB]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E5E7EB] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[#1F2937]">资源库</h1>
        <p className="text-xs text-[#6B7280]">资源种类、数量与分布一览</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.key} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{card.icon}</span>
                <div>
                  <p className="text-xl font-bold text-[#1F2937]">{stats?.[card.key] ?? 0}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RSS read stats */}
        {stats && stats.rss_read_stats.total > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs text-[#6B7280]">
            <span>RSS 阅读进度</span>
            <div className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.round((stats.rss_read_stats.read / stats.rss_read_stats.total) * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-[#1F2937] font-medium">
              {stats.rss_read_stats.read}/{stats.rss_read_stats.total}
            </span>
            <span className="text-indigo-600 font-medium">
              {stats.rss_read_stats.translated} 已翻译
            </span>
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="mb-2 text-xs font-medium text-[#1F2937]">类型分布</h3>
            {stats?.type_distribution.length ? (
              <TypeDistributionChart data={stats.type_distribution} />
            ) : (
              <p className="py-8 text-center text-xs text-[#9CA3AF]">暂无数据</p>
            )}
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="mb-2 text-xs font-medium text-[#1F2937]">来源分布</h3>
            {stats?.source_distribution.length ? (
              <SourceDistributionChart data={stats.source_distribution} />
            ) : (
              <p className="py-8 text-center text-xs text-[#9CA3AF]">暂无数据</p>
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <h3 className="mb-2 text-xs font-medium text-[#1F2937]">近 30 天新增</h3>
          {stats?.daily_activity.length ? (
            <ActivityBarChart data={stats.daily_activity} />
          ) : (
            <p className="py-8 text-center text-xs text-[#9CA3AF]">暂无数据</p>
          )}
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="mb-2 text-xs font-medium text-[#1F2937]">累计增长</h3>
            {stats?.growth_timeline.length ? (
              <GrowthTimelineChart data={stats.growth_timeline} />
            ) : (
              <p className="py-8 text-center text-xs text-[#9CA3AF]">暂无数据</p>
            )}
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="mb-2 text-xs font-medium text-[#1F2937]">文件夹分布</h3>
            {stats?.folder_treemap.length ? (
              <FolderTreemapChart data={stats.folder_treemap} />
            ) : (
              <p className="py-8 text-center text-xs text-[#9CA3AF]">暂无数据</p>
            )}
          </div>
        </div>

        {/* Quick nav */}
        <div>
          <h2 className="mb-2 text-xs font-medium text-[#6B7280]">快速导航</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {navCards.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group rounded-xl border border-[#E5E7EB] bg-white p-4 transition hover:border-indigo-200 hover:shadow-md"
              >
                <div className={`mb-2 inline-flex rounded-lg bg-gradient-to-br ${feature.color} p-2 text-white text-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold text-[#1F2937] group-hover:text-indigo-600 transition">
                  {feature.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#6B7280]">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}