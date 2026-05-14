'use client';

import { useState, useEffect } from 'react';
import DashboardStatsRow from '@/components/resume-application/DashboardStatsRow';
import DashboardTrendChart from '@/components/resume-application/DashboardTrendChart';
import DashboardChannelChart from '@/components/resume-application/DashboardChannelChart';
import DashboardCityChart from '@/components/resume-application/DashboardCityChart';
import DashboardFunnelChart from '@/components/resume-application/DashboardFunnelChart';
import DashboardPositionCategoryChart from '@/components/resume-application/DashboardPositionCategoryChart';
import DashboardRecentReviews from '@/components/resume-application/DashboardRecentReviews';
import GradientBackground from '@/components/ui/gradient-background';
import type { DashboardStats } from '@/types';

// localStorage 数据结构
interface LocalRecord {
  id: string;
  company: string;
  position: string;
  status: string;
  appliedAt: string;
  city?: string;
  source?: string;
  notes?: string;
  match?: number;
}

const STORAGE_KEY = 'resume_tracker_records';

function loadFromStorage(): LocalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// 计算环比变化
function calcChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// 从 localStorage 数据生成 Dashboard 统计
function computeStatsFromLocal(records: LocalRecord[], range: '7d' | '30d' | 'all'): DashboardStats {
  const now = new Date();
  let filteredRecords = records;

  if (range === '7d') {
    const cutoff = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    filteredRecords = records.filter(r => r.appliedAt >= cutoff);
  } else if (range === '30d') {
    const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    filteredRecords = records.filter(r => r.appliedAt >= cutoff);
  }

  const total = filteredRecords.length;
  const interviewStatuses = ['面试中'];
  const interviews = filteredRecords.filter(r => interviewStatuses.includes(r.status)).length;
  // Offer 包含：Offer、已接受、已拒绝（都是收到offer的记录）
  const offers = filteredRecords.filter(r => ['Offer', '已接受', '已拒绝'].includes(r.status)).length;
  const accepted = filteredRecords.filter(r => r.status === '已接受').length;
  const rejected = filteredRecords.filter(r => r.status === '已拒绝').length;

  // 计算环比变化（本周 vs 上周）
  const today = new Date();
  const thisWeekStart = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const lastWeekStart = new Date(today.getTime() - 14 * 86400000).toISOString().slice(0, 10);
  const lastWeekEnd = thisWeekStart;

  const thisWeekRecords = records.filter(r => r.appliedAt >= thisWeekStart);
  const lastWeekRecords = records.filter(r => r.appliedAt >= lastWeekStart && r.appliedAt < lastWeekEnd);

  const thisWeekTotal = thisWeekRecords.length;
  const thisWeekInterviews = thisWeekRecords.filter(r => interviewStatuses.includes(r.status)).length;
  // Offer 包含：Offer、已接受、已拒绝
  const thisWeekOffers = thisWeekRecords.filter(r => ['Offer', '已接受', '已拒绝'].includes(r.status)).length;
  const thisWeekRejected = thisWeekRecords.filter(r => r.status === '已拒绝').length;
  const thisWeekAccepted = thisWeekRecords.filter(r => r.status === '已接受').length;

  const lastWeekTotal = lastWeekRecords.length;
  const lastWeekInterviews = lastWeekRecords.filter(r => interviewStatuses.includes(r.status)).length;
  const lastWeekOffers = lastWeekRecords.filter(r => ['Offer', '已接受', '已拒绝'].includes(r.status)).length;
  const lastWeekRejected = lastWeekRecords.filter(r => r.status === '已拒绝').length;

  const totalApplicationsChange = calcChange(thisWeekTotal, lastWeekTotal);
  const interviewCountChange = calcChange(thisWeekInterviews, lastWeekInterviews);
  const offersReceivedChange = calcChange(thisWeekOffers, lastWeekOffers);
  const rejectionCountChange = calcChange(thisWeekRejected, lastWeekRejected);

  // Offer 转化率变化
  const thisWeekOfferAcceptRate = thisWeekOffers > 0 ? Math.round((thisWeekAccepted / thisWeekOffers) * 100) : 0;
  const lastWeekOfferAcceptRate = lastWeekOffers > 0 ? Math.round((lastWeekRecords.filter(r => r.status === '已接受').length / lastWeekOffers) * 100) : 0;
  const offerAcceptanceRateChange = lastWeekOfferAcceptRate > 0 ? thisWeekOfferAcceptRate - lastWeekOfferAcceptRate : (thisWeekOfferAcceptRate > 0 ? 100 : 0);

  // Channel distribution
  const channelMap = new Map<string, number>();
  for (const r of filteredRecords) {
    const ch = r.source || 'Boss直聘';
    channelMap.set(ch, (channelMap.get(ch) || 0) + 1);
  }
  const channelDistribution = Array.from(channelMap.entries()).map(([channel, count]) => ({
    channel,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // Status distribution
  const statusMap = new Map<string, number>();
  for (const r of filteredRecords) {
    statusMap.set(r.status, (statusMap.get(r.status) || 0) + 1);
  }
  const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // Application trend - 根据筛选范围生成数据，包含转化路径数据
  // 先计算全部历史的累积值作为基准
  const allTimeTrend: { date: string; count: number; interviews: number; offers: number; accepted: number }[] = [];
  const sortedRecords = [...records].sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));

  // 按日期分组统计
  const recordsByDate = new Map<string, LocalRecord[]>();
  for (const r of sortedRecords) {
    const list = recordsByDate.get(r.appliedAt) || [];
    list.push(r);
    recordsByDate.set(r.appliedAt, list);
  }

  // 计算每日数据和累积值
  let cumulativeCount = 0;
  let cumulativeInterviews = 0;
  let cumulativeOffers = 0;
  let cumulativeAccepted = 0;

  const allDates = Array.from(recordsByDate.keys()).sort();
  for (const dateStr of allDates) {
    const dayRecords = recordsByDate.get(dateStr) || [];
    cumulativeCount += dayRecords.length;
    cumulativeInterviews += dayRecords.filter(r => interviewStatuses.includes(r.status)).length;
    cumulativeOffers += dayRecords.filter(r => ['Offer', '已接受', '已拒绝'].includes(r.status)).length;
    cumulativeAccepted += dayRecords.filter(r => r.status === '已接受').length;

    allTimeTrend.push({
      date: dateStr,
      count: cumulativeCount,
      interviews: cumulativeInterviews,
      offers: cumulativeOffers,
      accepted: cumulativeAccepted,
    });
  }

  // 根据筛选范围截取显示数据
  const trendDays = range === '7d' ? 7 : range === '30d' ? 30 : 60;
  const cutoffDate = new Date(now.getTime() - trendDays * 86400000).toISOString().slice(0, 10);
  const applicationTrend = allTimeTrend.filter(t => t.date >= cutoffDate);

  // Status timeline - 最近7天
  const statusTimeline: { date: string; status: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayRecords = records.filter(r => r.appliedAt === dateStr);
    const dayStatusMap = new Map<string, number>();
    for (const r of dayRecords) {
      dayStatusMap.set(r.status, (dayStatusMap.get(r.status) || 0) + 1);
    }
    for (const [status, count] of dayStatusMap) {
      statusTimeline.push({ date: dateStr, status, count });
    }
  }

  // City distribution
  const cityMap = new Map<string, number>();
  for (const r of filteredRecords) {
    if (r.city) cityMap.set(r.city, (cityMap.get(r.city) || 0) + 1);
  }
  const cityDistribution = Array.from(cityMap.entries())
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);

  // Position category conversion - 基于职位名推断类别
  const categoryMap = new Map<string, { total: number; interviews: number; offers: number }>();
  for (const r of filteredRecords) {
    // 更精确的类别推断
    let category = '未分类';
    const pos = r.position.toLowerCase();

    // 检查是否包含多个关键词，优先匹配更具体的
    if (pos.includes('产品运营')) category = '产品运营';
    else if (pos.includes('产品') || pos.includes('pm')) category = '产品';
    else if (pos.includes('运营')) category = '运营';
    else if (pos.includes('技术') || pos.includes('开发') || pos.includes('工程师') || pos.includes('前端') || pos.includes('后端') || pos.includes('全栈')) category = '技术';
    else if (pos.includes('设计') || pos.includes('ui') || pos.includes('ux')) category = '设计';
    else if (pos.includes('数据') || pos.includes('分析')) category = '数据';
    else if (pos.includes('市场') || pos.includes('营销') || pos.includes('推广')) category = '市场';
    else if (pos.includes('销售') || pos.includes('商务')) category = '销售';
    else if (pos.includes('人力') || pos.includes('hr')) category = '人力';

    const entry = categoryMap.get(category) || { total: 0, interviews: 0, offers: 0 };
    entry.total++;
    if (interviewStatuses.includes(r.status) || r.status === 'Offer' || r.status === '已接受' || r.status === '已拒绝') {
      entry.interviews++;
    }
    if (r.status === 'Offer' || r.status === '已接受') entry.offers++;
    categoryMap.set(category, entry);
  }
  const positionCategoryConversion = Array.from(categoryMap.entries()).map(([category, v]) => ({
    category,
    total: v.total,
    interviews: v.interviews,
    offers: v.offers,
  }));

  // Funnel stages - 累积关系，每个阶段包含后面所有阶段
  // 投递 >= 筛选通过 >= 面试中 >= 终面 >= Offer >= 接受
  const acceptedCount = filteredRecords.filter(r => r.status === '已接受').length;
  const offerCount = filteredRecords.filter(r => r.status === 'Offer' || r.status === '已接受').length;
  const finalInterviewCount = filteredRecords.filter(r =>
    r.status === '终面' || r.status === 'Offer' || r.status === '已接受'
  ).length;
  const interviewingCount = filteredRecords.filter(r =>
    ['面试中', '终面', 'Offer', '已接受'].includes(r.status)
  ).length;
  const screenedCount = filteredRecords.filter(r =>
    r.status !== '已投递' && r.status !== '观望'
  ).length;

  const funnelStages = [
    { stage: '投递', count: total },
    { stage: '筛选通过', count: screenedCount },
    { stage: '面试中', count: interviewingCount },
    { stage: '终面', count: finalInterviewCount },
    { stage: 'Offer', count: offerCount },
    { stage: '接受', count: acceptedCount },
  ];

  // Recent reviews
  const recentReviews = filteredRecords
    .filter(r => r.notes || (r.status !== '已投递' && r.status !== '观望'))
    .slice(0, 10)
    .map(r => ({
      id: r.id,
      company_name: r.company,
      position_name: r.position,
      status: r.status as any,
      notes: r.notes || null,
      updated_at: r.appliedAt,
    }));

  return {
    total_applications: total,
    interview_count: interviews,
    interview_pass_rate: total > 0 ? Math.round((interviews / total) * 100) : 0,
    offers_received: offers,
    offer_acceptance_rate: offers > 0 ? Math.round((accepted / offers) * 100) : 0,
    rejection_count: rejected,
    rejection_reasons: [],
    channel_distribution: channelDistribution,
    status_distribution: statusDistribution,
    application_trend: applicationTrend,
    status_timeline: statusTimeline,
    city_distribution: cityDistribution,
    position_category_conversion: positionCategoryConversion,
    funnel_stages: funnelStages,
    recent_reviews: recentReviews,
    // 环比变化
    total_applications_change: totalApplicationsChange,
    interview_count_change: interviewCountChange,
    offers_received_change: offersReceivedChange,
    offer_acceptance_rate_change: offerAcceptanceRateChange,
    rejection_count_change: rejectionCountChange,
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'30d' | '7d' | 'all'>('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/resume/dashboard?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.stats && d.stats.total_applications > 0) {
          setStats(d.stats);
        } else {
          // API 无数据，从 localStorage 读取
          const localRecords = loadFromStorage();
          if (localRecords.length > 0) {
            setStats(computeStatsFromLocal(localRecords, range));
          } else {
            setStats(null);
          }
        }
      })
      .catch(() => {
        // API 出错，从 localStorage 读取
        const localRecords = loadFromStorage();
        if (localRecords.length > 0) {
          setStats(computeStatsFromLocal(localRecords, range));
        } else {
          setStats(null);
        }
      })
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">暂无投递数据</p>
          <p className="mt-2 text-sm text-muted-foreground">添加投递记录后，看板数据将自动展示</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <GradientBackground />
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">投递看板</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">全面追踪投递数据，优化求职策略</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                range === r ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === '7d' ? '近7天' : r === '30d' ? '近30天' : '全部'}
            </button>
          ))}
        </div>
      </div>

      {/* Top: Stats row */}
      <DashboardStatsRow stats={stats} />

      {/* Middle: Trend + Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardTrendChart applicationTrend={stats.application_trend} />
        </div>
        <DashboardChannelChart data={stats.channel_distribution} />
      </div>

      {/* Lower: Position category + City */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardPositionCategoryChart data={stats.position_category_conversion} />
        <DashboardCityChart data={stats.city_distribution} />
      </div>

      {/* Bottom: Funnel + Recent reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardFunnelChart stages={stats.funnel_stages} />
        <DashboardRecentReviews items={stats.recent_reviews} />
      </div>

      {/* Rejection reasons (if any) */}
      {stats.rejection_reasons.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">未通过原因分析</h3>
          <div className="space-y-2">
            {stats.rejection_reasons.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-rose-50/50 px-3 py-2">
                <span className="text-sm text-foreground">{r.reason}</span>
                <span className="text-sm font-medium text-rose-600">{r.count} 次</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}