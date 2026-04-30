'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (date: string) => void;
  availableDates: string[];
}

function getTodayShanghai(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

function formatDateLabel(date: string): string {
  const today = getTodayShanghai();
  if (date === today) return '今天';
  const d = new Date(date + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const pad: (number | null)[] = Array(firstDay).fill(null);
  return [...pad, ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function NewsDatePicker({ value, onChange, availableDates }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [today, setToday] = useState('');
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(0);

  useEffect(() => {
    const now = new Date();
    setToday(getTodayShanghai());
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);

  useEffect(() => {
    const d = new Date(value + 'T00:00:00');
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const calendarDays = getCalendarDays(viewYear, viewMonth);
  const availableSet = new Set(availableDates);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const dateStr = d.toLocaleDateString('sv-SE');
    if (dateStr > today) return;
    onChange(dateStr);
    setOpen(false);
  };

  const currentLabel = formatDateLabel(value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-5 py-3 text-base text-foreground transition hover:bg-muted hover:border-indigo-200"
      >
        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        <span className="font-medium">{currentLabel}</span>
        <svg className={`h-4 w-4 text-muted-foreground transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-2xl border border-border bg-card p-5 shadow-xl">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-base font-semibold text-foreground">{viewYear}年{viewMonth + 1}月</span>
            <button onClick={nextMonth} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-sm font-medium text-muted-foreground py-1.5">{w}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className="py-2" />;
              const dateStr = new Date(viewYear, viewMonth, day).toLocaleDateString('sv-SE');
              const isFuture = dateStr > today;
              const isSelected = dateStr === value;
              const hasData = availableSet.has(dateStr);
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  disabled={isFuture}
                  className={`relative rounded-lg py-2.5 text-base transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : isFuture
                        ? 'text-[#D1D5DB] cursor-not-allowed'
                        : hasData
                          ? 'text-foreground hover:bg-indigo-50 font-medium'
                          : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {day}
                  {hasData && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> 有数据</span>
          </div>
        </div>
      )}
    </div>
  );
}
