'use client';

import { useState, useEffect } from 'react';

const DAYS = [
  { value: 1, label: '周一' }, { value: 2, label: '周二' }, { value: 3, label: '周三' },
  { value: 4, label: '周四' }, { value: 5, label: '周五' }, { value: 6, label: '周六' }, { value: 7, label: '周日' },
];

export default function LearningReminderSettings() {
  const [time, setTime] = useState('20:00');
  const [enabledDays, setEnabledDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings/learning-reminder')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.reminder) {
          setTime(d.reminder.reminder_time);
          setEnabledDays(d.reminder.enabled_days);
          setEnabled(d.reminder.enabled);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/learning-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_time: time, enabled_days: enabledDays, enabled }),
      });
      const d = await res.json();
      if (res.ok) setMessage({ type: 'success', text: '已保存' });
      else setMessage({ type: 'error', text: d.error || '保存失败' });
    } catch { setMessage({ type: 'error', text: '保存失败' }); }
    finally { setSaving(false); }
  }

  function toggleDay(day: number) {
    setEnabledDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  if (loading) return <div className="h-20 flex items-center"><div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">学习提醒</h2>
        <p className="mt-1 text-xs text-muted-foreground">设定每日学习时间，到点弹出提醒</p>
      </div>

      {/* Enable toggle */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">开启提醒</span>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-muted-foreground/30'}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* Time picker */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">提醒时间</span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={!enabled}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm disabled:opacity-40"
        />
      </div>

      {/* Day checkboxes */}
      <div className="mb-5">
        <span className="mb-2 block text-sm text-muted-foreground">提醒日期</span>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => {
            const isActive = enabledDays.includes(d.value);
            return (
              <button
                key={d.value}
                onClick={() => { if (enabled) toggleDay(d.value); }}
                disabled={!enabled}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                  isActive ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save + message */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-700">
          {saving ? '保存中...' : '保存'}
        </button>
        {message && (
          <span className={`text-xs ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>{message.text}</span>
        )}
      </div>
    </div>
  );
}
