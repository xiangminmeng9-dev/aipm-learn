'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Building2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import type { ApplicationCalendarDay } from '@/types';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const statusStyle: Record<string, string> = {
  '已投递': 'text-muted-foreground bg-muted',
  '简历筛选': 'text-amber-600 bg-amber-100',
  '初面': 'text-indigo-600 bg-indigo-100',
  '二面': 'text-indigo-600 bg-indigo-100',
  '终面': 'text-indigo-600 bg-indigo-100',
  '已发offer': 'text-emerald-600 bg-emerald-100',
  '已接受': 'text-emerald-600 bg-emerald-100',
  '已拒绝': 'text-red-600 bg-red-100',
  '观望': 'text-muted-foreground bg-muted',
  '笔/面试': 'text-amber-600 bg-amber-100',
  'OC': 'text-purple-600 bg-purple-100',
  '面试中': 'text-indigo-600 bg-indigo-100',
  'Offer': 'text-emerald-600 bg-emerald-100',
};

interface LocalRecord {
  id: string;
  company: string;
  position: string;
  status: string;
  appliedAt: string;
  city?: string;
  notes?: string;
  source?: string;
  match?: number;
  interviewTime?: string;
  interviewDate?: string;
}

const STORAGE_KEY = 'resume_tracker_records';

function loadFromStorage(): LocalRecord[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function getUpcomingTasks(records: LocalRecord[]): (LocalRecord & { daysUntil: number })[] {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const interviewStatuses = ['笔/面试', '面试中', 'OC'];
  const upcoming = records
    .filter(r => interviewStatuses.includes(r.status) && r.interviewDate)
    .map(r => {
      const diffTime = new Date(r.interviewDate!).getTime() - now.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...r, daysUntil };
    })
    .filter(r => r.daysUntil <= 7 && r.daysUntil >= -1)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);
  return upcoming;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<ApplicationCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<LocalRecord[]>([]);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resume/calendar?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        if (data.days && data.days.length > 0) setDays(data.days);
      }
      const localRecords = loadFromStorage();
      setAllRecords(localRecords);
      if (localRecords.length > 0) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const monthRecords = localRecords.filter(r => r.appliedAt >= startDate && r.appliedAt <= endDate);
        const byDate = new Map<string, LocalRecord[]>();
        for (const rec of monthRecords) {
          const list = byDate.get(rec.appliedAt) || [];
          list.push(rec);
          byDate.set(rec.appliedAt, list);
        }
        const interviewStatuses = ['初面', '二面', '终面', '笔/面试', '面试中', 'OC'];
        const calendarDays: ApplicationCalendarDay[] = Array.from(byDate.entries())
          .map(([date, recs]) => ({
            date,
            applications_count: recs.length,
            interviews: recs.filter(r => interviewStatuses.includes(r.status)).map(r => ({
              company_name: r.company, position_name: r.position, status: r.status as '初面' | '二面' | '终面',
            })),
            has_note: recs.some(r => r.notes),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setDays(calendarDays);
      } else { setDays([]); }
    } catch {
      const localRecords = loadFromStorage();
      setAllRecords(localRecords);
      setDays([]);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

  // 监听 storage 变化，实时更新日历
  useEffect(() => {
    const handleStorageChange = () => {
      const localRecords = loadFromStorage();
      setAllRecords(localRecords);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('applicationsUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applicationsUpdated', handleStorageChange);
    };
  }, []);

  const dayMap = new Map(days.map((d) => [d.date, d]));
  const upcomingTasks = getUpcomingTasks(allRecords);

  const prevMonth = () => { if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1); };

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDayOfWeek = firstDay.getDay();
  const startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  const today = new Date().toISOString().slice(0, 10);

  // 获取指定日期的面试记录（带时间），按时间排序
  const getInterviewTimes = (dateStr: string) => {
    return allRecords
      .filter(r => r.interviewDate === dateStr && ['笔/面试', '面试中', 'OC'].includes(r.status))
      .sort((a, b) => {
        // 有时间的排前面，按时间排序
        const timeA = a.interviewTime || '99:99';
        const timeB = b.interviewTime || '99:99';
        return timeA.localeCompare(timeB);
      });
  };

  // 获取指定日期的所有面试记录
  const getInterviewsByDate = (dateStr: string) => {
    return allRecords
      .filter(r => r.interviewDate === dateStr && ['笔/面试', '面试中', 'OC'].includes(r.status))
      .sort((a, b) => {
        const timeA = a.interviewTime || '99:99';
        const timeB = b.interviewTime || '99:99';
        return timeA.localeCompare(timeB);
      })
      .map(r => ({
        company_name: r.company,
        position_name: r.position,
        status: r.status as '初面' | '二面' | '终面',
        interviewTime: r.interviewTime,
      }));
  };

  const selectedDayData = selectedDate ? dayMap.get(selectedDate) : null;
  const selectedInterviews = selectedDate ? getInterviewsByDate(selectedDate) : [];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* 背景光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background:'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background:'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background:'radial-gradient(circle, #818CF8 0%, transparent 70%)', transform:'translate(-50%,-50%)' }} />
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">投递日历</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">按日历视图查看你的投递节奏和面试安排</p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-border bg-card p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold text-foreground">{year} 年 {month} 月</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><ChevronRight className="h-5 w-5" /></button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((w) => (<div key={w} className="py-2.5 text-center text-sm font-semibold text-muted-foreground">{w}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} className="aspect-square" />;
                  const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const dayData = dayMap.get(dateStr);
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const interviewTimes = getInterviewTimes(dateStr);
                  const interviewsByDate = getInterviewsByDate(dateStr);
                  const hasContent = dayData || interviewTimes.length > 0 || interviewsByDate.length > 0;
                  return (
                    <button key={dateStr} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`min-h-[80px] rounded-xl flex flex-col items-start p-2.5 text-left transition-all duration-200 ${
                        isSelected ? 'bg-primary/20 border-2 border-primary/40 text-foreground' :
                        isToday ? 'bg-primary/10 border-2 border-primary/20' :
                        'border-2 border-border hover:bg-muted hover:border-primary/20'
                      }`}>
                      <span className={`text-base font-bold leading-none ${isToday && !isSelected ? 'text-primary' : isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{day}</span>
                      {hasContent && (
                        <div className="mt-1.5 w-full space-y-1">
                          {dayData && dayData.applications_count > 0 && (<div className={`text-xs leading-tight font-semibold ${isSelected ? 'text-foreground' : 'text-primary'}`}>{dayData.applications_count} 家投递</div>)}
                          {interviewsByDate.slice(0, 3).map((r, idx) => (
                            <div key={idx} className="text-xs leading-tight flex items-center gap-1 text-amber-600 font-medium">
                              <Clock className="h-3 w-3" />
                              {r.interviewTime && <span>{r.interviewTime}</span>}
                              <span className="truncate">{r.company_name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 选中日期的详情 */}
              {selectedDate && (
                <div className="mt-5 rounded-xl border-2 border-border bg-muted/50 p-4">
                  <h3 className="text-base font-bold text-foreground mb-3">{selectedDate}</h3>
                  <div className="space-y-2.5">
                    {/* 面试列表 - 按时间排序 */}
                    {selectedInterviews.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4 text-amber-600" />
                        {r.interviewTime && <span className="text-amber-600 font-semibold">{r.interviewTime}</span>}
                        <span className="text-foreground">{r.company_name}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-foreground">{r.position_name}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyle[r.status] || 'text-muted-foreground bg-muted'}`}>{r.status}</span>
                      </div>
                    ))}
                    {/* 投递记录 */}
                    {selectedDayData && selectedDayData.applications_count > 0 && (
                      <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                        <Building2 className="h-4 w-4" /> {selectedDayData.applications_count} 家投递
                      </div>
                    )}
                    {/* 备注 */}
                    {selectedDayData?.has_note && <span className="text-xs font-medium text-amber-600">含有备注</span>}
                    {/* 无记录提示 */}
                    {(!selectedDayData || selectedDayData.applications_count === 0) && selectedInterviews.length === 0 && (
                      <p className="text-sm font-medium text-muted-foreground">当天无投递或面试记录</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-5 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> 投递</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 面试</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 备注</span>
              </div>
            </>
          )}
        </div>

        {/* 即将到来的面试 */}
        {upcomingTasks.length > 0 && (
          <div className="mt-5 rounded-xl border-2 border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">即将到来的面试</h3>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border-2 border-border bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-lg font-bold text-primary">{task.daysUntil === 0 ? '今' : task.daysUntil === 1 ? '明' : task.daysUntil}</span>
                      {task.daysUntil > 1 && <span className="text-[10px] text-muted-foreground">天后</span>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{task.company}</p>
                      <p className="text-xs font-medium text-muted-foreground">{task.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {task.interviewTime && (<span className="flex items-center gap-1 text-sm font-semibold text-amber-600"><Clock className="h-4 w-4" />{task.interviewTime}</span>)}
                    <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusStyle[task.status] || 'text-muted-foreground bg-muted'}`}>{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
