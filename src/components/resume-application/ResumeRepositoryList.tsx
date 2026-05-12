'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ResumeRepositoryItem } from '@/types';

interface Props {
  items: ResumeRepositoryItem[];
  onRefresh: () => void;
}

export default function ResumeRepositoryList({ items, onRefresh }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此简历记录？关联的版本记录不受影响。')) return;
    await fetch(`/api/resume/repository/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('zh-CN');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <Card key={item.id} className="border-border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{item.company_name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{item.position_name}</p>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{item.file_name || '粘贴文本'}</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {isExpanded ? '收起 JD' : '查看 JD'}
              </button>
              {isExpanded && (
                <div className="mt-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {item.jd_text || '暂无 JD 文本'}
                </div>
              )}
              {item.jd_link && (
                <a href={item.jd_link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <ExternalLink className="h-3 w-3" /> 原始链接
                </a>
              )}
            </CardContent>
          </Card>
        );
      })}
      {items.length === 0 && (
        <div className="col-span-full py-12 text-center text-muted-foreground">暂无简历，点击"+ 上传简历"开始</div>
      )}
    </div>
  );
}
