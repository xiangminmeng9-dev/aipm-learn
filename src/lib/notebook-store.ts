/**
 * Notebook storage layer — transparently uses Supabase API when authenticated,
 * localStorage when not. All notebook pages import from here instead of
 * calling fetch() directly.
 */

/* ─── Types ─── */

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string; // e.g. "9:00", "14:30" — hour on the 0-24 timeline
  duration: string; // e.g. "30min", "1h"
  status: 'todo' | 'in_progress' | 'done';
  sort_order: number;
  from_template: boolean;
  created_at: string;
  updated_at: string;
}

/* ─── Helpers ─── */

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

/* ─── Local-storage implementation ─── */

const LS_NOTES = 'nb_notes';
const LS_TASKS = 'nb_tasks';

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function lsSet<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

/* ─── Seed data ─── */

const SEED_NOTES_KEY = 'nb_notes_seeded_v1';
const SEED_TASKS_KEY = 'nb_tasks_seeded_v1';

function seedNotesIfEmpty(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_NOTES_KEY)) return;
  const existing = lsGet<Note>(LS_NOTES);
  if (existing.length > 0) { localStorage.setItem(SEED_NOTES_KEY, '1'); return; }
  const t = now();
  const seeds: Note[] = [
    { id: uid(), title: '用户反馈：AI 回答准确率不稳定', content: '# 现象\n部分用户反馈模型在长 Prompt 场景下回答发散。\n\n# 假设\n- 上下文过长导致关键指令被稀释\n- 未开启缓存命中，token 成本高\n\n# 下一步\n- 拆分 prompt 分段\n- 引入 prompt caching\n- 增加 golden set 做回归', category: 'problem', tags: ['AI', '用户反馈'], pinned: true, created_at: t, updated_at: t },
    { id: uid(), title: 'AI PM 的北极星：任务完成率 × 用户留存', content: '# 洞察\nAI 产品的北极星不应只是 DAU，更应关注：\n1. **任务完成率**：用户发起的 Query 中实际有用的比例\n2. **留存结构**：N 日回访且完成核心任务的用户占比\n\n好的 AI 产品让用户越用越聪明，差的让用户越用越依赖。', category: 'insight', tags: ['方法论', '指标'], pinned: true, created_at: t, updated_at: t },
    { id: uid(), title: 'Week 16 产研周会纪要', content: '## 议题\n1. Q2 路线图确认\n2. 模型升级灰度方案\n3. 数据埋点 Review\n\n## Action Items\n- [ ] @研发 本周完成 Claude 4.7 灰度链路 (Owner: 张)\n- [ ] @数据 补齐 funnel 埋点 (Owner: 李)\n- [ ] @设计 对齐新版 Chat UI (Owner: 王)', category: 'meeting', tags: ['周会', 'Q2'], pinned: false, created_at: t, updated_at: t },
    { id: uid(), title: '面试常考：如何评估一个 AI Agent 的效果？', content: '# 框架\n## 1. 任务层\n- 任务成功率 (Pass@1 / Pass@K)\n- 平均步骤数、工具调用数\n\n## 2. 体验层\n- 首字延迟 (TTFT)\n- 完成耗时\n- 用户中断率\n\n## 3. 成本层\n- Token 成本\n- Tool call 失败率\n\n## 4. 安全层\n- 幻觉率\n- 越权调用率', category: 'general', tags: ['面试', 'Agent'], pinned: false, created_at: t, updated_at: t },
    { id: uid(), title: '竞品速记：Cursor vs. Claude Code', content: 'Cursor 强在 IDE 内联体验与多文件 context；Claude Code 强在 Agent 自主执行与 Skills 生态。\n\n差异化方向：把 **Skills 市场** 做成开发者的"效率货架"。', category: 'insight', tags: ['竞品', 'DevTool'], pinned: false, created_at: t, updated_at: t },
  ];
  lsSet(LS_NOTES, seeds);
  localStorage.setItem(SEED_NOTES_KEY, '1');
}

function seedTasksIfEmpty(date: string): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_TASKS_KEY)) return;
  const existing = lsGet<Task>(LS_TASKS);
  if (existing.length > 0) { localStorage.setItem(SEED_TASKS_KEY, '1'); return; }
  const t = now();
  const mk = (title: string, desc: string, start: string, dur: string, status: Task['status'], order: number, tpl = true): Task => ({
    id: uid(), title, description: desc, date, start_time: start, duration: dur, status, sort_order: order, from_template: tpl, created_at: t, updated_at: t,
  });
  const seeds: Task[] = [
    mk('晨会同步', '与团队同步昨日进展和今日计划', '9:00', '30min', 'done', 0),
    mk('需求评审：Agent 任务列表 V2', '评审新需求，明确优先级和验收标准', '10:00', '1h', 'done', 1),
    mk('数据分析：DAU 异常波动', '查看核心指标，分析昨日 DAU 下跌原因', '11:00', '1h', 'in_progress', 2),
    mk('午餐 & 充电', '', '12:00', '1h', 'todo', 3, false),
    mk('用户调研：AI PM 目标用户访谈', '3 位资深 PM 的深访，提炼痛点洞察', '14:00', '1.5h', 'todo', 4),
    mk('AI 模型评估', '评估 Claude 4.7 在 PRD 生成任务上的效果', '16:00', '1h', 'todo', 5),
    mk('A/B 实验复盘', '查看新版首页实验结果，决策是否全量', '17:00', '45min', 'todo', 6),
    mk('日报撰写', '总结今日进展，规划明日重点', '18:00', '30min', 'todo', 7),
    mk('读一篇 Anthropic 论文', 'Claude Opus 4.7 的 system card 简读', '', '45min', 'todo', 8, false),
  ];
  lsSet(LS_TASKS, seeds);
  localStorage.setItem(SEED_TASKS_KEY, '1');
}

/* ─── Notes API ─── */

export async function getNotes(category?: string): Promise<{ notes: Note[]; authed: boolean }> {
  // Try API first
  const res = await fetch(`/api/notebook/notes${category ? `?category=${category}` : ''}`);
  if (res.ok) {
    const d = await res.json();
    return { notes: d.notes ?? [], authed: true };
  }
  // Fallback to localStorage
  seedNotesIfEmpty();
  let notes = lsGet<Note>(LS_NOTES);
  if (category) notes = notes.filter((n) => n.category === category);
  notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return { notes, authed: false };
}

export async function createNote(title: string, category: string): Promise<{ note: Note; authed: boolean }> {
  // Try API
  const res = await fetch('/api/notebook/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, category }),
  });
  if (res.ok) {
    const d = await res.json();
    return { note: d.note, authed: true };
  }
  // Fallback
  const note: Note = { id: uid(), title, content: '', category, tags: [], pinned: false, created_at: now(), updated_at: now() };
  const notes = lsGet<Note>(LS_NOTES);
  notes.unshift(note);
  lsSet(LS_NOTES, notes);
  return { note, authed: false };
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<{ note: Note; authed: boolean }> {
  const res = await fetch(`/api/notebook/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (res.ok) {
    const d = await res.json();
    return { note: d.note, authed: true };
  }
  // Fallback
  const notes = lsGet<Note>(LS_NOTES);
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Note not found');
  notes[idx] = { ...notes[idx], ...updates, updated_at: now() };
  lsSet(LS_NOTES, notes);
  return { note: notes[idx], authed: false };
}

export async function deleteNote(id: string): Promise<{ authed: boolean }> {
  const res = await fetch(`/api/notebook/notes/${id}`, { method: 'DELETE' });
  if (res.ok) return { authed: true };
  const notes = lsGet<Note>(LS_NOTES).filter((n) => n.id !== id);
  lsSet(LS_NOTES, notes);
  return { authed: false };
}

/* ─── Tasks API ─── */

export async function getTasks(date: string): Promise<{ tasks: Task[]; authed: boolean }> {
  const res = await fetch(`/api/notebook/tasks?date=${date}`);
  if (res.ok) {
    const d = await res.json();
    return { tasks: d.tasks ?? [], authed: true };
  }
  const tasks = lsGet<Task>(LS_TASKS).filter((t) => t.date === date).sort((a, b) => a.sort_order - b.sort_order);
  if (tasks.length === 0) {
    seedTasksIfEmpty(date);
    const seeded = lsGet<Task>(LS_TASKS).filter((t) => t.date === date).sort((a, b) => a.sort_order - b.sort_order);
    return { tasks: seeded, authed: false };
  }
  return { tasks, authed: false };
}

export async function createTask(task: { title: string; description?: string; date: string; start_time?: string; duration?: string; from_template?: boolean }): Promise<{ tasks: Task[]; authed: boolean }> {
  const res = await fetch('/api/notebook/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (res.ok) {
    const d = await res.json();
    return { tasks: d.tasks ?? [], authed: true };
  }
  if (res.status === 409) return { tasks: [], authed: false }; // duplicate
  // Fallback
  const tasks = lsGet<Task>(LS_TASKS);
  const maxOrder = tasks.filter((t) => t.date === task.date).reduce((m, t) => Math.max(m, t.sort_order), -1);
  const newTask: Task = {
    id: uid(),
    title: task.title,
    description: task.description ?? '',
    date: task.date,
    start_time: task.start_time ?? '',
    duration: task.duration ?? '',
    status: 'todo',
    sort_order: maxOrder + 1,
    from_template: task.from_template ?? false,
    created_at: now(),
    updated_at: now(),
  };
  tasks.push(newTask);
  lsSet(LS_TASKS, tasks);
  return { tasks: [newTask], authed: false };
}

export async function createTasksBatch(items: { title: string; description?: string; start_time?: string; duration?: string; date: string; from_template?: boolean }[]): Promise<{ tasks: Task[]; authed: boolean }> {
  const res = await fetch('/api/notebook/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: items }),
  });
  if (res.ok) {
    const d = await res.json();
    return { tasks: d.tasks ?? [], authed: true };
  }
  // Fallback — add one by one, skip duplicates
  const allTasks = lsGet<Task>(LS_TASKS);
  const date = items[0]?.date || new Date().toISOString().slice(0, 10);
  let maxOrder = allTasks.filter((t) => t.date === date).reduce((m, t) => Math.max(m, t.sort_order), -1);
  const added: Task[] = [];
  for (const item of items) {
    if (allTasks.some((t) => t.date === date && t.title === item.title)) continue;
    const newTask: Task = {
      id: uid(),
      title: item.title,
      description: item.description ?? '',
      date,
      start_time: item.start_time ?? '',
      duration: item.duration ?? '',
      status: 'todo',
      sort_order: ++maxOrder,
      from_template: item.from_template ?? false,
      created_at: now(),
      updated_at: now(),
    };
    allTasks.push(newTask);
    added.push(newTask);
  }
  lsSet(LS_TASKS, allTasks);
  return { tasks: added, authed: false };
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<{ task: Task; authed: boolean }> {
  const res = await fetch(`/api/notebook/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (res.ok) {
    const d = await res.json();
    return { task: d.task, authed: true };
  }
  const tasks = lsGet<Task>(LS_TASKS);
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Task not found');
  tasks[idx] = { ...tasks[idx], ...updates, updated_at: now() };
  lsSet(LS_TASKS, tasks);
  return { task: tasks[idx], authed: false };
}

export async function deleteTask(id: string): Promise<{ authed: boolean }> {
  const res = await fetch(`/api/notebook/tasks/${id}`, { method: 'DELETE' });
  if (res.ok) return { authed: true };
  const tasks = lsGet<Task>(LS_TASKS).filter((t) => t.id !== id);
  lsSet(LS_TASKS, tasks);
  return { authed: false };
}

export async function reorderTasks(orders: { id: string; sort_order: number }[]): Promise<{ authed: boolean }> {
  const res = await fetch('/api/notebook/tasks/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
  });
  if (res.ok) return { authed: true };
  const tasks = lsGet<Task>(LS_TASKS);
  for (const o of orders) {
    const t = tasks.find((t) => t.id === o.id);
    if (t) t.sort_order = o.sort_order;
  }
  lsSet(LS_TASKS, tasks);
  return { authed: false };
}
