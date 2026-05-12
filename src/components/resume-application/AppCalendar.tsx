'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApplicationCalendarDay } from '@/types';
import { APPLICATION_STATUSES } from './constants';

interface Props {
  year: number;
  month: number;
  days: ApplicationCalendarDay[];
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function AppCalendar({ year, month, days, onMonthChange }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dayMap = new Map(days.map((d) => [d.date, d]));

  const prevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon=0

  const daysInMonth = lastDay.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date().toISOString().slice(0, 10);

  const selectedDay = selectedDate ? dayMap.get(selectedDate) : null;

  return (
    <div>
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h2 className="text-xl font-semibold text-foreground">
          {year} 年 {month} 月
        </h2>
        <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center text-base font-medium text-muted-foreground">{w}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayData = dayMap.get(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`min-h-[72px] md:min-h-[80px] rounded-xl flex flex-col items-start p-1.5 text-left transition-colors ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : isToday
                  ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <span className={`text-base md:text-lg font-semibold leading-none ${isSelected ? 'text-white' : ''}`}>{day}</span>
              {dayData && (
                <div className="mt-0.5 w-full space-y-0.5">
                  {dayData.applications_count > 0 && (
                    <div className={`truncate text-[11px] leading-tight ${isSelected ? 'text-white/90' : 'text-indigo-600'} font-medium`}>
                      {dayData.applications_count} 家
                    </div>
                  )}
                  {dayData.interviews.slice(0, 2).map((iv, idx) => {
                    const cfg = APPLICATION_STATUSES.find((s) => s.value === iv.status);
                    return (
                      <div key={idx} className={`truncate text-[11px] leading-tight ${isSelected ? 'text-white/80' : ''}`}>
                        {iv.company_name}
                        <span className={`ml-0.5 font-medium ${isSelected ? 'text-white/90' : cfg?.color || ''}`}>
                          {cfg?.label || iv.status}
                        </span>
                      </div>
                    );
                  })}
                  {dayData.interviews.length > 2 && (
                    <div className={`text-[11px] ${isSelected ? 'text-white/60' : 'text-muted-foreground'}`}>+{dayData.interviews.length - 2}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-foreground mb-2">{selectedDay.date}</h3>
          <div className="space-y-2">
            {selectedDay.applications_count > 0 && (
              <div className="flex items-center gap-2 text-base">
                <span className="text-indigo-600 font-medium">📝 {selectedDay.applications_count} 家投递</span>
              </div>
            )}
            {selectedDay.interviews.map((iv, i) => {
              const statusConfig = APPLICATION_STATUSES.find((s) => s.value === iv.status);
              return (
                <div key={i} className="flex items-center gap-2 text-base">
                  <span className={statusConfig?.color || 'text-muted-foreground'}>🎤 {iv.company_name} — {iv.position_name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-sm ${statusConfig?.bg || 'bg-muted'} ${statusConfig?.color || 'text-muted-foreground'}`}>{statusConfig?.label || iv.status}</span>
                </div>
              );
            })}
            {selectedDay.has_note && <span className="text-sm text-amber-600">📌 含有备注</span>}
            {selectedDay.applications_count === 0 && selectedDay.interviews.length === 0 && (
              <p className="text-base text-muted-foreground">当天无投递记录</p>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> 投递</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> 面试</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> 备注</span>
      </div>
    </div>
  );
}
