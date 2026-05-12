'use client';

import ReactECharts from '@/components/ui/EChartsWrapper';
import { CHART_COLORS_ARRAY } from './constants';
import { ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  data: { channel: string; count: number; percentage: number }[];
}

const CHANNEL_LABELS: Record<string, string> = { BOSS: 'BOSS直聘', '猎头': '猎头', '官网': '官网', '内推': '内推', '脉脉': '脉脉', '其他': '其他', 'Boss直聘': 'Boss直聘', 'LinkedIn': 'LinkedIn' };

export default function DashboardChannelChart({ data }: Props) {
  const [selectedChannel, setSelectedChannel] = useState<string>('');

  // 根据筛选条件过滤
  const filteredData = useMemo(() => {
    if (!selectedChannel) return data;
    return data.filter(d => (CHANNEL_LABELS[d.channel] || d.channel) === selectedChannel);
  }, [data, selectedChannel]);

  const total = filteredData.reduce((sum, d) => sum + d.count, 0);

  // 获取实际存在的渠道列表
  const channels = data.map(d => CHANNEL_LABELS[d.channel] || d.channel);

  const option = {
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      textStyle: { color: '#F9FAFB', fontSize: 12 },
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}: ${params.value} 家 (${params.percent}%)`,
    },
    graphic: [
      {
        type: 'text' as const,
        left: 'center',
        top: '42%',
        style: {
          text: String(total),
          textAlign: 'center',
          fill: '#F1F5F9',
          fontSize: 28,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text' as const,
        left: 'center',
        top: '56%',
        style: {
          text: '总投递数',
          textAlign: 'center',
          fill: '#64748B',
          fontSize: 12,
        },
      },
    ],
    series: [{
      type: 'pie' as const,
      radius: ['45%', '70%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: filteredData.map((d, i) => ({
        name: CHANNEL_LABELS[d.channel] || d.channel,
        value: d.count,
        itemStyle: { color: CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length] },
      })),
    }],
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">渠道表现</h3>
        <div className="relative">
          <select
            className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option value="">全部渠道</option>
            {channels.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* 左侧：饼图 */}
        <div className="w-[58%]">
          <ReactECharts option={option} style={{ height: 220 }} />
        </div>
        {/* 右侧：图例列表 */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {filteredData.slice(0, 5).map((d, i) => (
            <div key={d.channel} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length] }} />
                <span className="text-sm text-muted-foreground">{CHANNEL_LABELS[d.channel] || d.channel}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{d.count} ({d.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}