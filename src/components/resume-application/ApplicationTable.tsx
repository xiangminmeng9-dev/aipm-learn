'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import type { ResumeApplication, ApplicationChannel, ApplicationStatus } from '@/types';
import { APPLICATION_CHANNELS, APPLICATION_STATUSES } from './constants';

interface Props {
  applications: ResumeApplication[];
  onRefresh: () => void;
}

interface Filters {
  company: string;
  position: string;
  channel: string;
  status: string;
  city: string;
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: Filters = {
  company: '',
  position: '',
  channel: '',
  status: '',
  city: '',
  dateFrom: '',
  dateTo: '',
};

const EMPTY_ROWS_COUNT = 5;

function InlineInput({ value, onSave, placeholder, className }: {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setText(value); }, [value]);

  const commit = () => {
    setEditing(false);
    if (text !== value) onSave(text);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        className={`w-full rounded border border-indigo-300 bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-300 ${className || ''}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(value); setEditing(false); } }}
        placeholder={placeholder}
      />
    );
  }
  return (
    <button
      className={`w-full text-left px-1 py-1 rounded text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-text truncate ${className || ''}`}
      onClick={() => setEditing(true)}
    >
      {value || <span className="text-muted-foreground italic">{placeholder || '-'}</span>}
    </button>
  );
}

function InlineSelect({ value, options, onSave }: {
  value: string;
  options: { value: string; label: string }[];
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = (newVal: string) => {
    setEditing(false);
    if (newVal !== value) onSave(newVal);
  };

  if (editing) {
    return (
      <select
        ref={ref}
        className="w-full rounded border border-indigo-300 bg-background px-1 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-300"
        value={value}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setEditing(false)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <button
      className="w-full text-left px-1 py-1 rounded text-sm hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer truncate"
      onClick={() => setEditing(true)}
    >
      {value || <span className="text-muted-foreground italic">-</span>}
    </button>
  );
}

function EmptyRow({ onSaved }: { onSaved: () => void }) {
  const [companyName, setCompanyName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0, 10));
  const [city, setCity] = useState('');
  const [channel, setChannel] = useState<ApplicationChannel>('官网');
  const [status, setStatus] = useState<ApplicationStatus>('已投递');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    const c = companyName.trim();
    const p = positionName.trim();
    if (!c || !p) return;
    setSaving(true);
    await fetch('/api/resume/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: c,
        position_name: p,
        applied_at: appliedAt,
        city: city.trim() || null,
        channel,
        status,
      }),
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  }, [companyName, positionName, appliedAt, city, channel, status, onSaved]);

  if (saved) return null;

  return (
    <tr className="border-b border-border bg-muted/5">
      <td className="py-1.5 px-3">
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 placeholder:text-muted-foreground/50"
          placeholder="输入公司..."
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={() => { if (companyName.trim() && positionName.trim()) save(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        />
      </td>
      <td className="py-1.5 px-3">
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 placeholder:text-muted-foreground/50"
          placeholder="输入岗位..."
          value={positionName}
          onChange={(e) => setPositionName(e.target.value)}
          onBlur={() => { if (companyName.trim() && positionName.trim()) save(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
        />
      </td>
      <td className="py-1.5 px-3">
        <input
          type="date"
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 text-muted-foreground"
          value={appliedAt}
          onChange={(e) => setAppliedAt(e.target.value)}
        />
      </td>
      <td className="py-1.5 px-3">
        <input
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 placeholder:text-muted-foreground/50"
          placeholder="城市..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </td>
      <td className="py-1.5 px-3">
        <select
          className="w-full rounded border border-border bg-background px-1 py-1 text-sm outline-none focus:border-indigo-300"
          value={channel}
          onChange={(e) => setChannel(e.target.value as ApplicationChannel)}
        >
          {APPLICATION_CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
      </td>
      <td className="py-1.5 px-3">
        <select
          className="w-full rounded border border-border bg-background px-1 py-1 text-sm outline-none focus:border-indigo-300"
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </td>
      <td className="py-1.5 px-3" />
    </tr>
  );
}

export default function ApplicationTable({ applications, onRefresh }: Props) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<string>('applied_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [emptyKey, setEmptyKey] = useState(0);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      if (filters.company && !app.company_name.toLowerCase().includes(filters.company.toLowerCase())) return false;
      if (filters.position && !app.position_name.toLowerCase().includes(filters.position.toLowerCase())) return false;
      if (filters.channel && app.channel !== filters.channel) return false;
      if (filters.status && app.status !== filters.status) return false;
      if (filters.city && !(app.city || '').toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.dateFrom && app.applied_at < filters.dateFrom) return false;
      if (filters.dateTo && app.applied_at > filters.dateTo) return false;
      return true;
    });
  }, [applications, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortField] || '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortField] || '');
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/resume/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除？')) return;
    await fetch(`/api/resume/applications/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleRowSaved = () => {
    onRefresh();
    setEmptyKey((k) => k + 1);
  };

  const sortIcon = (field: string) => {
    if (sortField !== field) return <span className="text-muted-foreground ml-0.5 text-xs">↕</span>;
    return <span className="text-indigo-500 ml-0.5 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const clearFilters = () => setFilters(INITIAL_FILTERS);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Search className="h-3 w-3" />
          筛选
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-indigo-500 text-white text-[10px] px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-rose-500 flex items-center gap-0.5">
            <X className="h-3 w-3" /> 清除
          </button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {filtered.length} 条记录
        </span>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-muted/10">
          <input
            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            placeholder="公司..."
            value={filters.company}
            onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value }))}
          />
          <input
            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            placeholder="岗位..."
            value={filters.position}
            onChange={(e) => setFilters((f) => ({ ...f, position: e.target.value }))}
          />
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            value={filters.channel}
            onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value }))}
          >
            <option value="">全部渠道</option>
            {APPLICATION_CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">全部状态</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            placeholder="城市..."
            value={filters.city}
            onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          />
          <input
            type="date"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            title="开始日期"
          />
          <span className="text-xs text-muted-foreground">-</span>
          <input
            type="date"
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-indigo-300"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            title="结束日期"
          />
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground bg-muted/30">
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('company_name')}>公司{sortIcon('company_name')}</th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('position_name')}>岗位{sortIcon('position_name')}</th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('applied_at')}>投递时间{sortIcon('applied_at')}</th>
              <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('city')}>Base地{sortIcon('city')}</th>
              <th className="py-2.5 px-3">渠道</th>
              <th className="py-2.5 px-3">状态</th>
              <th className="py-2.5 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((app) => (
              <tr key={app.id} className="border-b border-border hover:bg-muted/20 transition-colors group">
                <td className="py-2 px-3">
                  <InlineInput value={app.company_name} onSave={(v) => patch(app.id, { company_name: v })} placeholder="公司名" className="font-medium" />
                </td>
                <td className="py-2 px-3">
                  <InlineInput value={app.position_name} onSave={(v) => patch(app.id, { position_name: v })} placeholder="岗位名" />
                </td>
                <td className="py-2 px-3">
                  <InlineInput value={app.applied_at} onSave={(v) => patch(app.id, { applied_at: v })} placeholder="日期" className="text-muted-foreground" />
                </td>
                <td className="py-2 px-3">
                  <InlineInput value={app.city || ''} onSave={(v) => patch(app.id, { city: v || null })} placeholder="城市" className="text-muted-foreground" />
                </td>
                <td className="py-2 px-3">
                  <InlineSelect
                    value={app.channel}
                    options={APPLICATION_CHANNELS.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
                    onSave={(v) => patch(app.id, { channel: v as ApplicationChannel })}
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <InlineSelect
                      value={app.status}
                      options={APPLICATION_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                      onSave={(v) => patch(app.id, { status: v as ApplicationStatus })}
                    />
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                </td>
                <td className="py-2 px-3">
                  <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(app.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* Always-show empty rows for direct input */}
            {Array.from({ length: EMPTY_ROWS_COUNT }).map((_, i) => (
              <EmptyRow key={`empty-${emptyKey}-${i}`} onSaved={handleRowSaved} />
            ))}

            {sorted.length === 0 && (
              <tr>
                <td className="py-8 text-center text-muted-foreground text-xs" colSpan={7}>
                  暂无记录，在上方空行中直接输入
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
