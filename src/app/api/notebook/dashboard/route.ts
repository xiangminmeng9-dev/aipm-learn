import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '30d';

    const now = new Date();
    const cutoffDate = range === '7d' ? new Date(now.getTime() - 7 * 86400000).toISOString()
                    : range === '30d' ? new Date(now.getTime() - 30 * 86400000).toISOString()
                    : new Date(0).toISOString();

    // 本地日期字符串，避免 UTC 时区偏移导致 date 类型字段过滤不准
    const localDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const cutoffLocalDate = localDateStr(new Date(now.getTime() - (range === '7d' ? 7 : range === '30d' ? 30 : 3650) * 86400000));

    // 并行查询
    const [
      notesRes,
      tasksRes,
      todosRes,
      aiNotesRes,
    ] = await Promise.all([
      supabase.from('notebook_notes').select('id, title, category, created_at, updated_at').eq('user_id', user.id).gte('created_at', cutoffDate).order('updated_at', { ascending: false }),
      supabase.from('notebook_daily_tasks').select('id, title, status, date, start_time, created_at').eq('user_id', user.id).gte('date', cutoffLocalDate).order('date', { ascending: false }),
      supabase.from('notebook_tasks').select('id, title, status, priority, due_date, created_at, completed_at').eq('user_id', user.id).eq('category', 'todo').gte('created_at', cutoffDate).order('created_at', { ascending: false }),
      supabase.from('notebook_ai_notes').select('id, title, created_at').eq('user_id', user.id).gte('created_at', cutoffDate).order('created_at', { ascending: false }),
    ]);

    if (tasksRes.error) console.error('Daily tasks query error:', tasksRes.error);

    const notes = notesRes.data || [];
    const tasks = tasksRes.data || [];
    const todos = todosRes.data || [];
    const aiNotes = aiNotesRes.data || [];

    // 笔记分类统计
    const categoryMap = new Map<string, number>();
    for (const n of notes) {
      const cat = n.category || '未分类';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 每日任务状态统计 (notebook_daily_tasks uses todo/in_progress/done)
    const dailyStatusMap = new Map<string, number>();
    for (const t of tasks) {
      const s = t.status || 'todo';
      dailyStatusMap.set(s, (dailyStatusMap.get(s) || 0) + 1);
    }
    const taskStatusStats = [
      { status: '待办', count: dailyStatusMap.get('todo') || 0, color: '#6366F1' },
      { status: '进行中', count: dailyStatusMap.get('in_progress') || 0, color: '#0EA5E9' },
      { status: '已完成', count: dailyStatusMap.get('done') || 0, color: '#10B981' },
    ];

    // 每日任务完成趋势
    const dailyCompletedTrendMap = new Map<string, number>();
    const dailyCreatedTrendMap = new Map<string, number>();
    for (const t of tasks) {
      const date = t.date || t.created_at?.slice(0, 10);
      if (date) dailyCreatedTrendMap.set(date, (dailyCreatedTrendMap.get(date) || 0) + 1);
      if (t.status === 'done' && date) dailyCompletedTrendMap.set(date, (dailyCompletedTrendMap.get(date) || 0) + 1);
    }

    // 待办事项统计
    const todoStatusMap = new Map<string, number>();
    for (const t of todos) {
      const s = t.status || 'pending';
      todoStatusMap.set(s, (todoStatusMap.get(s) || 0) + 1);
    }
    const todoStatusStats = [
      { status: '待办', count: todoStatusMap.get('pending') || 0, color: '#6366F1' },
      { status: '进行中', count: todoStatusMap.get('in_progress') || 0, color: '#F59E0B' },
      { status: '已完成', count: todoStatusMap.get('completed') || 0, color: '#10B981' },
    ];

    const todoPriorityMap = new Map<string, number>();
    for (const t of todos) {
      const p = t.priority || 'medium';
      todoPriorityMap.set(p, (todoPriorityMap.get(p) || 0) + 1);
    }
    const todoPriorityStats = [
      { priority: '高', count: todoPriorityMap.get('high') || 0, color: '#EF4444' },
      { priority: '中', count: todoPriorityMap.get('medium') || 0, color: '#F59E0B' },
      { priority: '低', count: todoPriorityMap.get('low') || 0, color: '#6366F1' },
    ];

    // 笔记创建趋势 + 每日任务完成趋势
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const noteTrendMap = new Map<string, number>();
    for (const n of notes) {
      const date = n.created_at.slice(0, 10);
      noteTrendMap.set(date, (noteTrendMap.get(date) || 0) + 1);
    }
    const activityTrend = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, notes: noteTrendMap.get(dateStr) || 0, tasks: dailyCompletedTrendMap.get(dateStr) || 0 };
    });

    // 环比
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const thisWeekNotes = notes.filter(n => n.created_at >= weekAgo).length;
    const lastWeekNotes = notes.filter(n => n.created_at >= twoWeeksAgo && n.created_at < weekAgo).length;
    const notesChange = lastWeekNotes > 0 ? Math.round(((thisWeekNotes - lastWeekNotes) / lastWeekNotes) * 100) : (thisWeekNotes > 0 ? 100 : 0);
    const thisWeekTasks = tasks.filter(t => t.status === 'done' && t.date && t.date >= weekAgo.slice(0, 10)).length;
    const lastWeekTasks = tasks.filter(t => t.status === 'done' && t.date && t.date >= twoWeeksAgo.slice(0, 10) && t.date < weekAgo.slice(0, 10)).length;
    const tasksChange = lastWeekTasks > 0 ? Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100) : (thisWeekTasks > 0 ? 100 : 0);

    // 待办趋势
    const todoCreatedTrendMap = new Map<string, number>();
    const todoCompletedTrendMap = new Map<string, number>();
    for (const t of todos) {
      const createdDate = t.created_at.slice(0, 10);
      todoCreatedTrendMap.set(createdDate, (todoCreatedTrendMap.get(createdDate) || 0) + 1);
      if (t.completed_at) {
        const completedDate = t.completed_at.slice(0, 10);
        todoCompletedTrendMap.set(completedDate, (todoCompletedTrendMap.get(completedDate) || 0) + 1);
      }
    }
    const todoTrend = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, created: todoCreatedTrendMap.get(dateStr) || 0, completed: todoCompletedTrendMap.get(dateStr) || 0 };
    });

    // 最近笔记
    const recentNotes = notes.slice(0, 5).map(n => ({ id: n.id, title: n.title, category: n.category, updated_at: n.updated_at }));

    // 最近任务
    const recentTasks = tasks.slice(0, 5).map(t => ({ id: t.id, title: t.title, status: t.status === 'done' ? '已完成' : t.status === 'in_progress' ? '进行中' : '待办' }));

    return NextResponse.json({
      stats: {
        total_notes: notes.length,
        total_ai_notes: aiNotes.length,
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'done').length,
        total_todos: todos.length,
        completed_todos: todos.filter(t => t.status === 'completed').length,
        notes_change: notesChange,
        tasks_change: tasksChange,
        category_distribution: categoryDistribution,
        task_status_stats: taskStatusStats,
        todo_status_stats: todoStatusStats,
        todo_priority_stats: todoPriorityStats,
        activity_trend: activityTrend,
        todo_trend: todoTrend,
        recent_notes: recentNotes,
        recent_tasks: recentTasks,
        recent_todos: todos.slice(0, 5).map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, due_date: t.due_date })),
      },
    });
  } catch (error) {
    console.error('Notebook dashboard error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}
