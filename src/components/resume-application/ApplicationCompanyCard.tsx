'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { ApplicationChannelBadge } from './ApplicationChannelBadge';
import ApplicationFormDialog from './ApplicationFormDialog';
import type { ResumeApplication } from '@/types';

interface Props {
  companyName: string;
  applications: ResumeApplication[];
  onRefresh: () => void;
}

export default function ApplicationCompanyCard({ companyName, applications, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<ResumeApplication | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此投递记录？')) return;
    await fetch(`/api/resume/applications/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleStatusChange = async (app: ResumeApplication, newStatus: string) => {
    await fetch(`/api/resume/applications/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onRefresh();
  };

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const offerCount = (statusCounts['已发offer'] || 0) + (statusCounts['已接受'] || 0);
  const interviewCount = (statusCounts['初面'] || 0) + (statusCounts['二面'] || 0) + (statusCounts['终面'] || 0);

  return (
    <>
      <Card className="border-border hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-left" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <span className="font-semibold text-foreground">{companyName}</span>
              <span className="text-xs text-muted-foreground">({applications.length} 个岗位)</span>
            </button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {interviewCount > 0 && <span className="text-indigo-600 font-medium">{interviewCount} 面试中</span>}
              {offerCount > 0 && <span className="text-emerald-600 font-medium">{offerCount} offer</span>}
              <Button variant="ghost" size="icon-xs" onClick={() => { setEditing(null); setShowForm(true); }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border text-left text-xs font-medium text-muted-foreground">
                  <th className="py-2 px-2">岗位</th>
                  <th className="py-2 px-2">渠道</th>
                  <th className="py-2 px-2">状态</th>
                  <th className="py-2 px-2">日期</th>
                  <th className="py-2 px-2">城市</th>
                  <th className="py-2 px-2 w-16">操作</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-t border-border hover:bg-muted/20">
                    <td className="py-2 px-2">{app.position_name}</td>
                    <td className="py-2 px-2"><ApplicationChannelBadge channel={app.channel} /></td>
                    <td className="py-2 px-2">
                      <select className="rounded border border-border bg-background px-1 py-0.5 text-xs mr-1" value={app.status} onChange={(e) => handleStatusChange(app, e.target.value)}>
                        <option value="已投递">已投递</option>
                        <option value="简历筛选">简历筛选</option>
                        <option value="初面">初面</option>
                        <option value="二面">二面</option>
                        <option value="终面">终面</option>
                        <option value="已发offer">已发offer</option>
                        <option value="已接受">已接受</option>
                        <option value="已拒绝">已拒绝</option>
                      </select>
                      <ApplicationStatusBadge status={app.status} />
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{app.applied_at}</td>
                    <td className="py-2 px-2 text-muted-foreground text-xs">{app.city || '-'}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon-xs" onClick={() => { setEditing(app); setShowForm(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(app.id)}>
                          <Trash2 className="h-3 w-3 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        )}
      </Card>

      <ApplicationFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={(app) => { onRefresh(); setShowForm(false); setEditing(null); }}
        editing={editing}
      />
    </>
  );
}
