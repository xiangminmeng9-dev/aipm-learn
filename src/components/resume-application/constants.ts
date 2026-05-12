import type { ApplicationChannel, ApplicationStatus } from '@/types';

export const APPLICATION_CHANNELS: { value: ApplicationChannel; label: string; icon: string }[] = [
  { value: 'BOSS', label: 'BOSS直聘', icon: '💼' },
  { value: '猎头', label: '猎头', icon: '🎯' },
  { value: '官网', label: '官网', icon: '🏢' },
  { value: '内推', label: '内推', icon: '🤝' },
  { value: '脉脉', label: '脉脉', icon: '💬' },
  { value: '其他', label: '其他', icon: '📌' },
];

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string; color: string; bg: string }[] = [
  { value: '已投递', label: '已投递', color: 'text-slate-600', bg: 'bg-slate-100' },
  { value: '简历筛选', label: '简历筛选', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: '初面', label: '初面', color: 'text-sky-600', bg: 'bg-sky-50' },
  { value: '二面', label: '二面', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: '终面', label: '终面', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { value: '已发offer', label: '已发offer', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: '已接受', label: '已接受', color: 'text-green-600', bg: 'bg-green-50' },
  { value: '已拒绝', label: '已拒绝', color: 'text-rose-600', bg: 'bg-rose-50' },
] as const;

export const CHART_COLORS = {
  indigo: '#6366F1',
  emerald: '#10B981',
  amber: '#F59E0B',
  sky: '#0EA5E9',
  rose: '#F43F5E',
  purple: '#8B5CF6',
  orange: '#F97316',
  teal: '#14B8A6',
  slate: '#64748B',
};

export const CHART_COLORS_ARRAY = Object.values(CHART_COLORS);
