'use client';

import ReactECharts from '@/components/ui/EChartsWrapper';
import { ChevronDown } from 'lucide-react';

interface Props {
  applicationTrend: { date: string; count: number; interviews: number; offers: number; accepted: number }[];
}

export default function DashboardTrendChart({ applicationTrend }: Props) {
  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const dates = applicationTrend.map((t) => t.date);
  const totalCounts = applicationTrend.map((t) => t.count);
  const interviewCounts = applicationTrend.map((t) => t.interviews);
  const offerCounts = applicationTrend.map((t) => t.offers);
  const acceptedCounts = applicationTrend.map((t) => t.accepted);

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: { color: '#F9FAFB', fontSize: 12 },
    },
    legend: {
      top: 0,
      left: 0,
      textStyle: { color: '#9CA3AF', fontSize: 11 },
      icon: 'circle' as const,
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
    },
    grid: { left: 16, right: 16, top: 40, bottom: 24 },
    xAxis: {
      type: 'category' as const,
      data: dates.map(formatDate),
      axisLabel: { color: '#9CA3AF', fontSize: 11 },
      axisLine: { lineStyle: { color: '#374151' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#9CA3AF', fontSize: 10 },
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' as const } },
    },
    series: [
      {
        name: '总投递',
        type: 'line' as const,
        data: totalCounts,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        lineStyle: { width: 3, color: '#6366F1' },
        itemStyle: { color: '#6366F1' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#6366F130' },
              { offset: 1, color: '#6366F105' },
            ],
          },
        },
      },
      {
        name: '面试',
        type: 'line' as const,
        data: interviewCounts,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#F59E0B' },
        itemStyle: { color: '#F59E0B' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#F59E0B25' },
              { offset: 1, color: '#F59E0B05' },
            ],
          },
        },
      },
      {
        name: 'Offer',
        type: 'line' as const,
        data: offerCounts,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#10B981' },
        itemStyle: { color: '#10B981' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10B98125' },
              { offset: 1, color: '#10B98105' },
            ],
          },
        },
      },
      {
        name: '已接受',
        type: 'line' as const,
        data: acceptedCounts,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 5,
        lineStyle: { width: 2.5, color: '#8B5CF6' },
        itemStyle: { color: '#8B5CF6' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#8B5CF625' },
              { offset: 1, color: '#8B5CF605' },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">投递趋势</h3>
        <div className="relative">
          <select className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors">
            <option>近7天</option>
            <option>近30天</option>
            <option>全部</option>
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      <ReactECharts option={option} style={{ height: 260 }} />
    </div>
  );
}