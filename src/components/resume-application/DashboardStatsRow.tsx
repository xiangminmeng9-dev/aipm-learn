'use client';

import { Send, MessageSquare, TrendingUp, Award, XCircle, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, change, color, bgColor, icon }: StatCardProps) {
  const renderChange = () => {
    if (change === undefined || change === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[12px] text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span>持平</span>
        </span>
      );
    }
    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[12px] text-emerald-600">
          <TrendingUp className="h-3 w-3" />
          <span>+{change}%</span>
          <span className="text-muted-foreground ml-0.5">较上周</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[12px] text-rose-600">
        <TrendingDown className="h-3 w-3" />
        <span>{change}%</span>
        <span className="text-muted-foreground ml-0.5">较上周</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`mt-1.5 text-[28px] font-bold ${color}`}>{value}</p>
          <div className="mt-1.5">
            {renderChange()}
          </div>
        </div>
        <div className={`rounded-xl p-3 ${bgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        label="总投递"
        value={stats.total_applications}
        change={stats.total_applications_change}
        color="text-indigo-600"
        bgColor="bg-indigo-50"
        icon={<Send className="h-5 w-5 text-indigo-500" />}
      />
      <StatCard
        label="面试中"
        value={stats.interview_count}
        change={stats.interview_count_change}
        color="text-sky-600"
        bgColor="bg-sky-50"
        icon={<MessageSquare className="h-5 w-5 text-sky-500" />}
      />
      <StatCard
        label="面试通过率"
        value={`${stats.interview_pass_rate}%`}
        change={stats.interview_pass_rate_change}
        color="text-amber-600"
        bgColor="bg-amber-50"
        icon={<TrendingUp className="h-5 w-5 text-amber-500" />}
      />
      <StatCard
        label="Offer 数"
        value={stats.offers_received}
        change={stats.offers_received_change}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
        icon={<Award className="h-5 w-5 text-emerald-500" />}
      />
      <StatCard
        label="Offer 转化率"
        value={`${stats.offer_acceptance_rate}%`}
        change={stats.offer_acceptance_rate_change}
        color="text-violet-600"
        bgColor="bg-violet-50"
        icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
      />
      <StatCard
        label="未通过"
        value={stats.rejection_count}
        change={stats.rejection_count_change}
        color="text-rose-600"
        bgColor="bg-rose-50"
        icon={<XCircle className="h-5 w-5 text-rose-500" />}
      />
    </div>
  );
}
