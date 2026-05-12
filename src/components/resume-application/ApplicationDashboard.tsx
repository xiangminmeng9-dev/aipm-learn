'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2, Briefcase, MapPin } from 'lucide-react';
import type { ResumeApplication } from '@/types';
import { APPLICATION_STATUSES } from './constants';

interface StatDef {
  key: string;
  label: string;
  color: string;
  bg: string;
  filter: (a: ResumeApplication) => boolean;
}

const STAT_DEFS: StatDef[] = [
  { key: 'applied', label: '已投递', color: 'text-slate-600', bg: 'bg-slate-50', filter: (a) => a.status === '已投递' },
  { key: 'screening', label: '筛选中', color: 'text-amber-600', bg: 'bg-amber-50', filter: (a) => a.status === '简历筛选' },
  { key: 'interview', label: '面试中', color: 'text-sky-600', bg: 'bg-sky-50', filter: (a) => ['初面', '二面', '终面'].includes(a.status) },
  { key: 'oc', label: 'OC', color: 'text-purple-600', bg: 'bg-purple-50', filter: (a) => a.status === '已发offer' },
  { key: 'accepted', label: '已接受', color: 'text-emerald-600', bg: 'bg-emerald-50', filter: (a) => a.status === '已接受' },
  { key: 'rejected', label: '已拒绝', color: 'text-rose-600', bg: 'bg-rose-50', filter: (a) => a.status === '已拒绝' },
];

interface Props {
  applications: ResumeApplication[];
  onCompanySelect: (company: string | null) => void;
  selectedCompany: string | null;
}

export default function ApplicationDashboard({ applications, onCompanySelect, selectedCompany }: Props) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const groupedByCompany = applications.reduce((acc, app) => {
    const list = acc.get(app.company_name) || [];
    list.push(app);
    acc.set(app.company_name, list);
    return acc;
  }, new Map<string, ResumeApplication[]>());

  const groupedByCategory = applications.reduce((acc, app) => {
    const cat = app.position_category || '未分类';
    const list = acc.get(cat) || [];
    list.push(app);
    acc.set(cat, list);
    return acc;
  }, new Map<string, ResumeApplication[]>());

  const companyEntries = Array.from(groupedByCompany.entries());
  const categoryEntries = Array.from(groupedByCategory.entries());

  const counts = STAT_DEFS.map((def) => ({
    ...def,
    count: applications.filter(def.filter).length,
  }));

  const getStatusCounts = (apps: ResumeApplication[]) => {
    const map: Record<string, number> = {};
    apps.forEach((a) => {
      map[a.status] = (map[a.status] || 0) + 1;
    });
    return map;
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 pr-1">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2">
        {counts.map((stat) => (
          <div
            key={stat.key}
            className={`rounded-xl border border-border ${stat.bg} p-3 transition-colors hover:border-${stat.color.split('-')[1]}-200`}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`mt-0.5 text-xl font-bold ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* By company */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">按公司</h3>
        <div className="space-y-1">
          {companyEntries.map(([company, companyApps]) => {
            const isExpanded = expandedCompany === company;
            const isActive = selectedCompany === company;
            const statusCounts = getStatusCounts(companyApps);
            const interviewCount = companyApps.filter((a) => ['初面', '二面', '终面'].includes(a.status)).length;
            const offerCount = companyApps.filter((a) => a.status === '已发offer' || a.status === '已接受').length;

            return (
              <div key={company} className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className={`flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                    isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-400' : ''
                  }`}
                >
                  <button
                    onClick={() => setExpandedCompany(isExpanded ? null : company)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => onCompanySelect(isActive ? null : company)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{company}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{companyApps.length} 岗位</span>
                      {interviewCount > 0 && <span className="text-xs text-sky-600">{interviewCount} 面</span>}
                      {offerCount > 0 && <span className="text-xs text-emerald-600">{offerCount} offer</span>}
                    </div>
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-1.5">
                    {companyApps.map((app) => {
                      const statusDef = APPLICATION_STATUSES.find((s) => s.value === app.status);
                      return (
                        <div key={app.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-foreground truncate">{app.position_name}</span>
                          </div>
                          <span className={`shrink-0 ml-2 ${statusDef?.color || 'text-muted-foreground'}`}>
                            {app.status}
                          </span>
                        </div>
                      );
                    })}
                    {/* Mini status breakdown */}
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                      {Object.entries(statusCounts).map(([status, count]) => {
                        const def = APPLICATION_STATUSES.find((s) => s.value === status);
                        return (
                          <span key={status} className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] ${def?.bg || 'bg-muted'} ${def?.color || 'text-muted-foreground'}`}>
                            {status} {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {companyEntries.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">暂无公司</p>
          )}
        </div>
      </div>

      {/* By category */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">按岗位类别</h3>
        <div className="space-y-1">
          {categoryEntries.map(([category, categoryApps]) => {
            const isExpanded = expandedCategory === category;
            const statusCounts = getStatusCounts(categoryApps);

            return (
              <div key={category} className="rounded-lg border border-border bg-card overflow-hidden">
                <div
                  className="flex items-center gap-2 p-2.5 cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                >
                  <button className="text-muted-foreground hover:text-foreground shrink-0">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{category}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{categoryApps.length}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-1.5">
                    {categoryApps.map((app) => (
                      <div key={app.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-foreground truncate">{app.company_name}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-muted-foreground truncate">{app.position_name}</span>
                        </div>
                        {app.city && (
                          <span className="shrink-0 ml-2 text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {app.city}
                          </span>
                        )}
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                      {Object.entries(statusCounts).map(([status, count]) => {
                        const def = APPLICATION_STATUSES.find((s) => s.value === status);
                        return (
                          <span key={status} className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] ${def?.bg || 'bg-muted'} ${def?.color || 'text-muted-foreground'}`}>
                            {status} {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {categoryEntries.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">暂无分类</p>
          )}
        </div>
      </div>
    </div>
  );
}
