'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { type Task, getTasks, createTask, createTasksBatch, updateTask, deleteTask } from '@/lib/notebook-store';

function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ──────────────────────────── Config ──────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string; barGradient: string }> = {
  todo: { label: '待办', icon: '○', color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border', barGradient: 'from-indigo-400 to-violet-400' },
  in_progress: { label: '进行中', icon: '◐', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', barGradient: 'from-sky-400 to-blue-400' },
  done: { label: '已完成', icon: '●', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', barGradient: 'from-emerald-400 to-teal-400' },
};

const DAILY_TEMPLATES = [
  { title: '晨会同步', description: '与团队同步昨日进展和今日计划', start_time: '9:00', duration: '30min', icon: '🗣️' },
  { title: '需求评审', description: '评审新需求，明确优先级和验收标准', start_time: '10:00', duration: '1h', icon: '📋' },
  { title: '数据分析', description: '查看核心指标，分析异常波动', start_time: '11:00', duration: '1h', icon: '📊' },
  { title: '用户调研', description: '用户访谈或问卷分析，提炼洞察', start_time: '14:00', duration: '1.5h', icon: '🔍' },
  { title: 'AI 模型评估', description: '评估模型效果，分析 bad case', start_time: '16:00', duration: '1h', icon: '🤖' },
  { title: '产品文档撰写', description: 'PRD/技术方案/数据需求文档', start_time: '15:00', duration: '2h', icon: '✍️' },
  { title: '竞品分析', description: '追踪竞品动态，分析差异化策略', start_time: '13:00', duration: '1h', icon: '🔎' },
  { title: 'A/B 实验复盘', description: '查看实验结果，决策是否全量', start_time: '17:00', duration: '45min', icon: '🧪' },
  { title: '跨部门对齐', description: '与研发/设计/运营对齐进度', start_time: '11:30', duration: '30min', icon: '🤝' },
  { title: '周报/日报', description: '总结本周工作，规划下周重点', start_time: '18:00', duration: '30min', icon: '📝' },
];

const DURATION_OPTIONS = ['15min', '30min', '45min', '1h', '1.5h', '2h', '3h'];
const HOUR_HEIGHT = 64; // px per hour on the timeline
const MAX_COLUMNS = 5;
const TIMELINE_START = 0;
const TIMELINE_END = 24;

/* ──────────────────────────── Helpers ──────────────────────────── */

/** Parse "9:00" or "9:30" → fractional hours (9.0, 9.5) */
function parseTime(time: string): number {
  if (!time) return -1;
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return -1;
  return parseInt(m[1]) + parseInt(m[2]) / 60;
}

/** Parse "30min" or "1.5h" → minutes */
function parseDuration(dur: string): number {
  if (!dur) return 60; // default 1h
  const m = dur.match(/^(\d+\.?\d*)\s*(min|h)$/);
  if (!m) return 60;
  const val = parseFloat(m[1]);
  return m[2] === 'h' ? val * 60 : val;
}

/** Format fractional hours → "9:00" */
function formatHour(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/** Assign columns to tasks to avoid overlap (greedy) */
function assignColumns(tasks: Task[]): Map<string, number> {
  const colMap = new Map<string, number>();
  // Sort by start_time, then by duration descending
  const sorted = [...tasks].sort((a, b) => {
    const sa = parseTime(a.start_time);
    const sb = parseTime(b.start_time);
    if (sa !== sb) return sa - sb;
    return parseDuration(b.duration) - parseDuration(a.duration);
  });

  // Track end time per column
  const colEnds: number[] = [];

  for (const t of sorted) {
    const start = parseTime(t.start_time);
    const end = start + parseDuration(t.duration) / 60;
    let placed = false;
    for (let c = 0; c < colEnds.length; c++) {
      if (start >= colEnds[c] - 0.01) {
        colEnds[c] = end;
        colMap.set(t.id, c);
        placed = true;
        break;
      }
    }
    if (!placed) {
      colMap.set(t.id, colEnds.length);
      colEnds.push(end);
    }
  }
  return colMap;
}

/** Tasks without start_time get placed in an "unscheduled" zone below the timeline */
function getScheduledTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => parseTime(t.start_time) >= 0);
}

function getUnscheduledTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => parseTime(t.start_time) < 0);
}

/* ──────────────────────────── Glass Button ──────────────────────────── */

function GlassButton({
  children,
  onClick,
  className = '',
  color = 'indigo',
  size = 'sm',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  color?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 border-indigo-200/60',
    rose: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 border-rose-200/60',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-emerald-200/60',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border-amber-200/60',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 border-purple-200/60',
    gray: 'bg-secondary hover:bg-gray-200/80 text-muted-foreground border-border',
  };
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border backdrop-blur-sm shadow-sm transition-all duration-200 active:scale-95 ${colorMap[color] || colorMap.indigo} ${sizeClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

/* ──────────────────────────── Timeline Task Bar ──────────────────────────── */

function TimelineTaskBar({
  task,
  column,
  totalColumns,
  onOpen,
  onStatusChange,
  onDelete,
  onResize,
}: {
  task: Task;
  column: number;
  totalColumns: number;
  onOpen: () => void;
  onStatusChange: (status: Task['status']) => void;
  onDelete: () => void;
  onResize: (id: string, newDuration: string) => void;
}) {
  const startHour = parseTime(task.start_time);
  const durationMin = parseDuration(task.duration);
  const durationHours = durationMin / 60;
  const top = startHour * HOUR_HEIGHT;
  const height = Math.max(durationHours * HOUR_HEIGHT, 28); // min height
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const isDone = task.status === 'done';

  // Column width calculation
  const colWidth = 100 / totalColumns;
  const left = column * colWidth;
  const width = colWidth - 1.5; // gap between columns

  const [isResizing, setIsResizing] = useState(false);
  const justResized = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartDuration = useRef(0); // in hours

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isResizing,
  });

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    justResized.current = true;
    resizeStartY.current = e.clientY;
    resizeStartDuration.current = durationHours;
  };

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - resizeStartY.current;
      const deltaHours = delta / HOUR_HEIGHT;
      const newDurationHours = Math.round((resizeStartDuration.current + deltaHours) * 2) / 2; // snap to 30min
      const clampedHours = Math.max(0.5, Math.min(24 - startHour, newDurationHours));
      const newDurationMin = clampedHours * 60;
      const newDuration = newDurationMin >= 60
        ? (newDurationMin % 60 === 0 ? `${newDurationMin / 60}h` : `${(newDurationMin / 60).toFixed(1).replace(/\.0$/, '')}h`)
        : `${newDurationMin}min`;
      onResize(task.id, newDuration);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      setTimeout(() => { justResized.current = false; }, 100);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startHour, task.id, onResize]);

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}%`,
    width: `${width}%`,
    height: `${height}px`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : 10,
  };

  // Compact display for short tasks
  const isCompact = height < 50;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-task-bar className={isDragging ? 'opacity-60' : ''}>
      <div
        className={`group relative h-full cursor-pointer overflow-hidden rounded-xl border ${sc.border} bg-card shadow-sm transition-all duration-200 hover:shadow-md ${isDone ? 'opacity-60' : ''}`}
        onClick={(e) => { e.stopPropagation(); if (!justResized.current) onOpen(); }}
      >
        {/* Gradient color bar at left */}
        <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${sc.barGradient}`} />

        <div className="h-full pl-2.5 pr-2 py-1 flex flex-col justify-center">
          {/* Title row */}
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Status toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const next: Record<string, Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
                onStatusChange(next[task.status]);
              }}
              className={`flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                isDone ? 'border-emerald-400 bg-emerald-400 text-white' : task.status === 'in_progress' ? 'border-sky-400 bg-sky-50' : 'border-border bg-card'
              }`}
            >
              {isDone && <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              {task.status === 'in_progress' && <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
            </button>
            <span className={`truncate text-xs font-semibold ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {task.title}
            </span>
          </div>

          {/* Time + duration row (hide if very compact) */}
          {!isCompact && (
            <div className="mt-0.5 flex items-center gap-2 pl-5.5">
              {task.start_time && (
                <span className="text-[10px] text-muted-foreground">{task.start_time}</span>
              )}
              {task.duration && (
                <span className="text-[10px] text-muted-foreground">· {task.duration}</span>
              )}
              {task.from_template && (
                <span className="rounded bg-purple-50 px-1 py-0 text-[9px] font-medium text-purple-500">模板</span>
              )}
            </div>
          )}
        </div>
        {/* Delete button on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-50 text-rose-400 opacity-0 transition-opacity hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {/* Resize handle at bottom */}
        <div
          onMouseDown={handleResizeMouseDown}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 h-3 cursor-s-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-50/50"
        >
          <div className="h-0.5 w-6 rounded-full bg-gray-300 hover:bg-indigo-400" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Task Editor ──────────────────────────── */

function TaskEditor({
  task,
  onSave,
  onDelete,
  onClose,
}: {
  task: Task;
  onSave: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [startTime] = useState(task.start_time);
  const [duration, setDuration] = useState(task.duration);
  const [status, setStatus] = useState(task.status);
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.todo;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-4 z-50 flex items-center justify-center p-4 md:inset-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 30, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 30, scale: 0.95 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${sc.barGradient}`} />

        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${sc.color} ${sc.bg} border ${sc.border}`}>{sc.label}</span>
            <h2 className="text-lg font-bold text-foreground">{title || '未命名任务'}</h2>
          </div>
          <GlassButton onClick={onClose} color="gray">关闭</GlassButton>
        </div>
        <div className="space-y-4 p-6 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">任务标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="任务标题..." className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-300" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="任务描述..." rows={3} className="w-full resize-none rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-300" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">预计时长</label>
            <div className="flex flex-wrap gap-1.5">
              {startTime && (
                <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">{startTime} 开始</span>
              )}
              <button
                onClick={() => setDuration('')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${!duration ? 'bg-gray-800 text-white border-gray-800' : 'bg-muted text-muted-foreground border-border hover:bg-secondary'}`}
              >清除</button>
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(duration === d ? '' : d)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                    duration === d ? 'bg-indigo-500/15 text-indigo-600 border-indigo-200/60' : 'bg-muted text-muted-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">状态</label>
            <div className="flex items-center gap-2">
              {(['todo', 'in_progress', 'done'] as const).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const active = status === s;
                return (
                  <button key={s} onClick={() => setStatus(s)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${active ? `${cfg.color} ${cfg.bg} border ${cfg.border}` : 'text-muted-foreground hover:text-muted-foreground border border-transparent'}`}>
                    <span className={`h-2 w-2 rounded-full ${s === 'todo' ? 'bg-gray-300' : s === 'in_progress' ? 'bg-sky-400' : 'bg-emerald-400'}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-3">
          {task.id !== '__new__' ? (
            <GlassButton onClick={() => onDelete(task.id)} color="rose">删除</GlassButton>
          ) : <div />}
          <div className="flex items-center gap-2">
            <GlassButton onClick={onClose} color="gray">取消</GlassButton>
            <GlassButton onClick={() => onSave(task.id, { title, description, start_time: startTime, duration, status })} color="indigo" size="md">保存</GlassButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────────────────── Page ──────────────────────────── */

export default function DailyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelectedDate(localDateStr()); }, []);
  const pageRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchTasks = useCallback(async () => {
    const { tasks: t, authed } = await getTasks(selectedDate);
    setTasks(t);
    setIsAuthed(authed);
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { tasks: t, authed } = await getTasks(selectedDate);
      if (cancelled) return;
      setTasks(t);
      setIsAuthed(authed);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Assign columns (only for scheduled tasks)
  const scheduledTasks = useMemo(() => getScheduledTasks(tasks), [tasks]);
  const unscheduledTasks = useMemo(() => getUnscheduledTasks(tasks), [tasks]);
  const colMap = useMemo(() => assignColumns(scheduledTasks), [scheduledTasks]);
  const totalColumns = useMemo(() => {
    const maxCol = scheduledTasks.reduce((m, t) => Math.max(m, (colMap.get(t.id) ?? 0) + 1), 1);
    return Math.min(maxCol, MAX_COLUMNS);
  }, [scheduledTasks, colMap]);

  const handleAddTask = async (title: string, description = '', startTime = '', duration = '', fromTemplate = false) => {
    try {
      const { tasks: newTasks } = await createTask({ title, description, date: selectedDate, start_time: startTime, duration, from_template: fromTemplate });
      if (newTasks.length > 0) {
        await fetchTasks();
      }
    } catch (e) {
      console.error('Failed to add task:', e);
    }
  };

  const handleAddTemplates = async (templates: typeof DAILY_TEMPLATES) => {
    const items = templates.map((t) => ({ ...t, date: selectedDate, from_template: true }));
    await createTasksBatch(items);
    setShowTemplates(false);
    fetchTasks();
  };

  const handleStatusChange = async (id: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await updateTask(id, { status });
  };

  const handleResize = useCallback(async (id: string, newDuration: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, duration: newDuration } : t)));
    await updateTask(id, { duration: newDuration });
  }, []);

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    setEditingTask(null);
    fetchTasks();
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTask(id);
  };

  // Drag: snap to timeline position
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, delta } = event;
    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Calculate new start_time from vertical drag delta
    const currentStart = parseTime(task.start_time);
    const deltaHours = delta.y / HOUR_HEIGHT;
    let newStart = currentStart + deltaHours;

    // Clamp to 0-24
    const durationHours = parseDuration(task.duration) / 60;
    newStart = Math.max(0, Math.min(24 - durationHours, newStart));

    // Snap to 30 min
    newStart = Math.round(newStart * 2) / 2;

    const newStartTime = formatHour(newStart);
    if (newStartTime !== task.start_time) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, start_time: newStartTime } : t)));
      await updateTask(taskId, { start_time: newStartTime });
    }
  };

  // Click on empty timeline area to add task
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-task-bar]')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.max(0, Math.min(23.5, Math.floor((y / HOUR_HEIGHT) * 2) / 2)); // snap to 30min
    const startTime = formatHour(hour);

    // Quick add with this start time
    setEditingTask({
      id: '__new__',
      title: '',
      description: '',
      date: selectedDate,
      start_time: startTime,
      duration: '1h',
      status: 'todo',
      sort_order: 0,
      from_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  // Show hover preview on timeline
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-task-bar]')) {
      setHoverHour(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.max(0, Math.min(23.5, Math.floor((y / HOUR_HEIGHT) * 2) / 2));
    setHoverHour(hour);
  };

  const handleTimelineMouseLeave = () => {
    setHoverHour(null);
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
    setIsLoading(true);
  };

  const isToday = selectedDate === localDateStr();
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Format selectedDate for header display
  const dateLabel = useMemo(() => {
    const d = new Date(selectedDate);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · ${weekdays[d.getDay()]}`;
  }, [selectedDate]);

  const nowLabel = useMemo(() => {
    if (!isToday) return '';
    const n = new Date();
    return `当前 ${n.getHours()}:${n.getMinutes().toString().padStart(2, '0')}`;
  }, [isToday]);

  // Auto-scroll to current time on mount (when viewing today)
  useEffect(() => {
    if (isLoading) return;
    if (!isToday || hasScrolledRef.current) return;
    requestAnimationFrame(() => {
      if (!timelineRef.current) return;
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const offsetInTimeline = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      const scrollContainer = timelineRef.current.closest('.overflow-y-auto');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const timelineRect = timelineRef.current.getBoundingClientRect();
        const relativeTop = timelineRect.top - containerRect.top + scrollContainer.scrollTop;
        scrollContainer.scrollTo({ top: relativeTop + offsetInTimeline, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: window.scrollY + timelineRef.current.getBoundingClientRect().top - 100 + offsetInTimeline, behavior: 'smooth' });
      }
      hasScrolledRef.current = true;
    });
  }, [isToday, isLoading]);

  // Current time indicator
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const showNowLine = isToday;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>;
  }

  return (
    <div className="min-h-full p-6 md:p-8">
      {/* Header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1600&q=80&auto=format')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/75 via-violet-800/55 to-blue-900/70" />
        <div className="relative z-10 flex items-start justify-between px-8 py-6">
          <div>
            <h1 className="mb-1 text-2xl font-bold text-white">✅ AI PM 每日任务</h1>
            <p className="text-sm text-white/80">{dateLabel}{nowLabel && <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur">{nowLabel}</span>}</p>
            <p className="mt-1 text-xs text-white/60">0-24 小时时间轴 · 拖拽调整 · 最多 5 列并行</p>
            {!isAuthed && <p className="mt-2 text-xs text-white/40">数据保存在本地 · <a href="/login" className="underline hover:text-white/60">登录</a>后可同步至云端</p>}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => changeDate(-1)} color="gray">←</GlassButton>
          <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setIsLoading(true); }} className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground" />
          {!isToday && <GlassButton onClick={() => { setSelectedDate(localDateStr()); setIsLoading(true); }} color="emerald">今天</GlassButton>}
          <GlassButton onClick={() => changeDate(1)} color="gray">→</GlassButton>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton onClick={() => setShowTemplates(!showTemplates)} color={showTemplates ? 'purple' : 'gray'}>📋 AI PM 模板</GlassButton>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">完成进度</p>
              <p className="text-sm font-semibold text-foreground">{doneCount}/{totalCount}</p>
            </div>
            <div className="relative h-9 w-9">
              <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke={progressPct === 100 ? '#22c55e' : '#6366f1'} strokeWidth="3" strokeDasharray={`${progressPct * 0.88} 88`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-muted-foreground">{progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="rounded-2xl border border-purple-200/60 bg-purple-50/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-700">AI PM 每日工作模板</h3>
                <GlassButton onClick={() => handleAddTemplates(DAILY_TEMPLATES)} color="purple">一键添加全部</GlassButton>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                {DAILY_TEMPLATES.map((tpl) => {
                  const exists = tasks.some((t) => t.title === tpl.title && t.from_template);
                  return (
                    <button
                      key={tpl.title}
                      onClick={() => {
                        if (exists) return;
                        handleAddTask(tpl.title, tpl.description, tpl.start_time, tpl.duration, true);
                      }}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${exists ? 'cursor-default border-emerald-100 bg-emerald-50/50' : 'border-border bg-card hover:border-purple-300 hover:bg-purple-50/50 active:scale-95'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{tpl.icon}</span>
                        <span className="text-xs font-medium text-foreground">{tpl.title}</span>
                        {exists && <span className="text-[10px] text-emerald-500">✓</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{tpl.start_time}</span>
                        <span>· {tpl.duration}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex">
            {/* Hour labels column */}
            <div className="flex-shrink-0 w-14 border-r border-border" style={{ height: `${TIMELINE_END * HOUR_HEIGHT}px` }}>
              {Array.from({ length: TIMELINE_END + 1 }, (_, h) => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-2 text-[10px] text-muted-foreground font-medium"
                  style={{ height: `${HOUR_HEIGHT}px` }}
                >
                  <span className="-mt-1.5">{h}:00</span>
                </div>
              ))}
            </div>

            {/* Timeline area */}
            <div
              ref={timelineRef}
              className="relative flex-1 cursor-crosshair"
              style={{ height: `${TIMELINE_END * HOUR_HEIGHT}px` }}
              onClick={handleTimelineClick}
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={handleTimelineMouseLeave}
            >
              {/* Hour grid lines */}
              {Array.from({ length: TIMELINE_END + 1 }, (_, h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border"
                  style={{ top: `${h * HOUR_HEIGHT}px` }}
                />
              ))}
              {/* Half-hour dashed lines */}
              {Array.from({ length: TIMELINE_END }, (_, h) => (
                <div
                  key={`half-${h}`}
                  className="absolute left-0 right-0 border-t border-dashed border-gray-50"
                  style={{ top: `${(h + 0.5) * HOUR_HEIGHT}px` }}
                />
              ))}

              {/* Current time indicator */}
              {showNowLine && (
                <div
                  className="absolute left-0 right-0 z-20 flex items-center"
                  style={{ top: `${nowHour * HOUR_HEIGHT}px` }}
                >
                  <div className="h-3 w-3 rounded-full bg-rose-500 -ml-1.5" />
                  <div className="h-0.5 flex-1 bg-rose-500" />
                </div>
              )}

              {/* Hover preview indicator */}
              {hoverHour !== null && (
                <div
                  className="absolute left-0 right-0 z-15 flex items-center pointer-events-none"
                  style={{ top: `${hoverHour * HOUR_HEIGHT}px` }}
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-400 -ml-1" />
                  <div className="h-px flex-1 bg-indigo-400/60 border-dashed" />
                  <span className="absolute left-3 -top-3 rounded-md bg-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {formatHour(hoverHour)} 点击创建
                  </span>
                </div>
              )}

              {/* Task bars */}
              {scheduledTasks.map((task) => {
                const col = colMap.get(task.id) ?? 0;
                return (
                  <TimelineTaskBar
                    key={task.id}
                    task={task}
                    column={col}
                    totalColumns={totalColumns}
                    onOpen={() => setEditingTask(task)}
                    onStatusChange={(s) => handleStatusChange(task.id, s)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onResize={handleResize}
                  />
                );
              })}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeTaskId ? (
              <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/80 px-3 py-2 text-xs font-semibold text-indigo-600 shadow-lg backdrop-blur-sm">
                {tasks.find((t) => t.id === activeTaskId)?.title ?? ''}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Unscheduled tasks (no start_time) */}
      {unscheduledTasks.length > 0 && (
        <div className="mt-4 rounded-2xl border border-amber-200/60 bg-amber-50/30 p-4">
          <h3 className="mb-3 text-xs font-semibold text-amber-700">📌 未安排时间的任务</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {unscheduledTasks.map((task) => {
              const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
              const isDone = task.status === 'done';
              return (
                <div
                  key={task.id}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl border ${sc.border} bg-card p-3 transition-all hover:shadow-md ${isDone ? 'opacity-60' : ''}`}
                  onClick={() => setEditingTask(task)}
                >
                  <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${sc.barGradient}`} />
                  <div className="pl-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next: Record<string, Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
                          handleStatusChange(task.id, next[task.status]);
                        }}
                        className={`flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                          isDone ? 'border-emerald-400 bg-emerald-400 text-white' : task.status === 'in_progress' ? 'border-sky-400 bg-sky-50' : 'border-border bg-card'
                        }`}
                      >
                        {isDone && <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {task.status === 'in_progress' && <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                      </button>
                      <span className={`truncate text-xs font-semibold ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-5.5">
                      {task.duration && <span>{task.duration}</span>}
                      {task.from_template && <span className="rounded bg-purple-50 px-1 py-0 text-[9px] font-medium text-purple-500">模板</span>}
                    </div>
                  </div>
                  {/* Delete on hover */}
                  <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-medium text-rose-500 hover:bg-rose-100">删除</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {tasks.length === 0 && (
        <div className="mt-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">暂无任务</p>
          <p className="mt-1 text-xs text-muted-foreground">点击时间轴空白处添加任务，或使用「📋 AI PM 模板」快速生成</p>
        </div>
      )}

      {/* Editor modal */}
      <AnimatePresence>
        {editingTask && (
          <TaskEditor
            task={editingTask}
            onSave={async (id, updates) => {
              if (id === '__new__') {
                // Create new task
                const title = (updates.title as string) || '新任务';
                await createTask({
                  title,
                  description: updates.description ?? '',
                  date: selectedDate,
                  start_time: updates.start_time ?? '',
                  duration: updates.duration ?? '1h',
                  from_template: false,
                });
                setEditingTask(null);
                fetchTasks();
              } else {
                handleUpdateTask(id, updates);
              }
            }}
            onDelete={(id) => {
              handleDeleteTask(id);
              setEditingTask(null);
            }}
            onClose={() => { setEditingTask(null); fetchTasks(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
