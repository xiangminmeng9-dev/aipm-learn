'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { APPLICATION_CHANNELS, APPLICATION_STATUSES } from './constants';
import { apiFetch } from '@/lib/api/fetch';
import type { ResumeApplication } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (app: ResumeApplication) => void;
  editing: ResumeApplication | null;
}

export default function ApplicationFormDialog({ open, onClose, onSaved, editing }: Props) {
  const [companyName, setCompanyName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [channel, setChannel] = useState('官网');
  const [status, setStatus] = useState('已投递');
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [city, setCity] = useState('');
  const [positionCategory, setPositionCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setCompanyName(editing.company_name);
      setPositionName(editing.position_name);
      setChannel(editing.channel);
      setStatus(editing.status);
      setAppliedAt(editing.applied_at);
      setCity(editing.city || '');
      setPositionCategory(editing.position_category || '');
      setNotes(editing.notes || '');
    } else {
      setCompanyName('');
      setPositionName('');
      setChannel('官网');
      setStatus('已投递');
      setAppliedAt(new Date().toISOString().slice(0, 10));
      setCity('');
      setPositionCategory('');
      setNotes('');
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!companyName.trim() || !positionName.trim()) return;
    setSaving(true);
    const url = editing
      ? `/api/resume/applications/${editing.id}`
      : '/api/resume/applications';
    const method = editing ? 'PATCH' : 'POST';
    const body: Record<string, unknown> = {
      company_name: companyName.trim(),
      position_name: positionName.trim(),
      channel,
      applied_at: appliedAt,
      city: city.trim() || null,
      position_category: positionCategory.trim() || null,
      notes: notes.trim() || null,
    };
    if (!editing) body.status = status;

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      onSaved(data.application || data.item);
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑投递记录' : '新增投递记录'}</DialogTitle>
          <DialogDescription>记录投递的公司、岗位和进度信息。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">公司名称 *</label>
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="如：字节跳动" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">岗位名称 *</label>
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={positionName} onChange={(e) => setPositionName(e.target.value)} placeholder="如：AI产品经理" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">投递渠道</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value)}>
                {APPLICATION_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">投递日期</label>
              <input type="date" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
            </div>
          </div>
          {!editing && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">初始状态</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">城市</label>
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)} placeholder="如：北京" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">职位类别</label>
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={positionCategory} onChange={(e) => setPositionCategory(e.target.value)} placeholder="如：AI产品/增长" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">备注</label>
            <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="投递渠道URL、面试备注等..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !companyName.trim() || !positionName.trim()}>
              {saving ? '保存中...' : editing ? '更新' : '添加'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
