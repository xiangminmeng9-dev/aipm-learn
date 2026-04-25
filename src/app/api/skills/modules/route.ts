import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { data: modules, error } = await supabase
      .from('skill_modules')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: '获取技能模块失败', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    const { data: allTasks } = await supabase.from('learning_tasks').select('id, module_id');

    const { data: progress } = await supabase
      .from('learning_progress')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const completedTaskIds = new Set((progress ?? []).map((p) => p.task_id));

    const tasksByModule = new Map<string, { total: number; completed: number }>();
    for (const task of allTasks ?? []) {
      const entry = tasksByModule.get(task.module_id) ?? { total: 0, completed: 0 };
      entry.total++;
      if (completedTaskIds.has(task.id)) entry.completed++;
      tasksByModule.set(task.module_id, entry);
    }

    // 计算每个模块的进度百分比，用于解锁判断
    const moduleProgressMap = new Map<string, number>();
    for (const m of modules ?? []) {
      const counts = tasksByModule.get(m.id) ?? { total: 0, completed: 0 };
      const pct = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
      moduleProgressMap.set(m.id, pct);
    }

    // 面试联动数据：type_skill_mappings 映射
    const { data: skillMappings } = await supabase
      .from('type_skill_mappings')
      .select('type_id, skill_module_id');

    // 构建 skill_module_id → type_id[] 映射
    const mappingsByModule = new Map<string, string[]>();
    for (const m of skillMappings ?? []) {
      const list = mappingsByModule.get(m.skill_module_id) ?? [];
      list.push(m.type_id);
      mappingsByModule.set(m.skill_module_id, list);
    }

    // 面试联动数据：用户各类型平均分
    const { data: answerScores } = await supabase
      .from('interview_answers')
      .select('score, question_type_id, question_types(name)')
      .not('score', 'is', null)
      .not('question_type_id', 'is', null);

    const typeScoreMap: Record<string, { name: string; scores: number[] }> = {};
    for (const a of answerScores ?? []) {
      if (!a.question_type_id) continue;
      const typeName = (a.question_types as unknown as { name: string })?.name ?? '未知';
      if (!typeScoreMap[a.question_type_id]) {
        typeScoreMap[a.question_type_id] = { name: typeName, scores: [] };
      }
      typeScoreMap[a.question_type_id].scores.push(a.score!);
    }

    // 面试联动数据：各类型方法论数量
    const { data: methodologyData } = await supabase
      .from('interview_methodologies')
      .select('type_id')
      .eq('user_id', user.id);

    const methodologyCountByType = new Map<string, number>();
    for (const m of methodologyData ?? []) {
      methodologyCountByType.set(m.type_id, (methodologyCountByType.get(m.type_id) ?? 0) + 1);
    }

    // JD 分析补充的自定义任务
    const { data: customTasks } = await supabase
      .from('user_custom_tasks')
      .select('id, module_id, status')
      .eq('user_id', user.id);

    const customTasksByModule = new Map<string, { total: number; completed: number }>();
    // 没有 module_id 的任务单独统计
    let orphanCustomCount = { total: 0, completed: 0 };
    for (const ct of customTasks ?? []) {
      if (ct.module_id) {
        const entry = customTasksByModule.get(ct.module_id) ?? { total: 0, completed: 0 };
        entry.total++;
        if (ct.status === 'completed') entry.completed++;
        customTasksByModule.set(ct.module_id, entry);
      } else {
        orphanCustomCount.total++;
        if (ct.status === 'completed') orphanCustomCount.completed++;
      }
    }

    const modulesWithProgress = (modules ?? []).map((m) => {
      const counts = tasksByModule.get(m.id) ?? { total: 0, completed: 0 };
      const customCounts = customTasksByModule.get(m.id) ?? { total: 0, completed: 0 };
      const totalCount = counts.total + customCounts.total;
      const totalCompleted = counts.completed + customCounts.completed;
      const prereqs = (m.prerequisites as string[]) ?? [];
      // 所有模块默认解锁
      const isUnlocked = true;

      // 面试联动：该模块关联的弱项题型
      const mappedTypeIds = mappingsByModule.get(m.id) ?? [];
      const weakTypes = mappedTypeIds
        .filter((tid) => {
          const scoreData = typeScoreMap[tid];
          return scoreData && scoreData.scores.length > 0
            ? scoreData.scores.reduce((s: number, v: number) => s + v, 0) / scoreData.scores.length < 6
            : false;
        })
        .map((tid) => typeScoreMap[tid]?.name)
        .filter(Boolean) as string[];

      // 面试联动：该模块关联的方法论数量
      const methodologyCount = mappedTypeIds.reduce((sum, tid) => sum + (methodologyCountByType.get(tid) ?? 0), 0);

      return {
        ...m,
        job_targets: m.job_targets as string[],
        prerequisites: prereqs,
        task_count: totalCount,
        completed_count: totalCompleted,
        progress_percentage: totalCount
          ? Math.round((totalCompleted / totalCount) * 100)
          : 0,
        is_unlocked: isUnlocked,
        interview_weak_types: weakTypes,
        interview_methodology_count: methodologyCount,
        is_custom: false as const,
      };
    });

    // 合并用户自定义模块
    const { data: userModules } = await supabase
      .from('user_skill_modules')
      .select('*')
      .eq('user_id', user.id)
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true });

    const userModuleIds = (userModules ?? []).map((m) => m.id);
    let userModuleTasks: { id: string; module_id: string; status: string }[] = [];
    if (userModuleIds.length > 0) {
      const { data: uTasks } = await supabase
        .from('user_module_tasks')
        .select('id, module_id, status')
        .in('module_id', userModuleIds);
      userModuleTasks = uTasks ?? [];
    }

    const userTasksByModule = new Map<string, { total: number; completed: number }>();
    for (const t of userModuleTasks) {
      const entry = userTasksByModule.get(t.module_id) ?? { total: 0, completed: 0 };
      entry.total++;
      if (t.status === 'completed') entry.completed++;
      userTasksByModule.set(t.module_id, entry);
    }

    const userModulesWithProgress = (userModules ?? []).map((m) => {
      const counts = userTasksByModule.get(m.id) ?? { total: 0, completed: 0 };
      return {
        id: m.id,
        slug: '',
        name: m.name,
        description: m.description,
        icon: m.icon,
        job_targets: m.job_targets as string[],
        level: m.level,
        level_name: m.level_name,
        prerequisites: [] as string[],
        sort_order: m.sort_order,
        task_count: counts.total,
        completed_count: counts.completed,
        progress_percentage: counts.total
          ? Math.round((counts.completed / counts.total) * 100)
          : 0,
        is_unlocked: true,
        interview_weak_types: [] as string[],
        interview_methodology_count: 0,
        is_custom: true as const,
      };
    });

    const allModules = [...modulesWithProgress, ...userModulesWithProgress];

    // 没有 module_id 的 JD 差距任务，作为虚拟模块展示
    if (orphanCustomCount.total > 0) {
      allModules.push({
        id: '__jd_gaps__',
        slug: '',
        name: '岗位差距',
        description: 'JD 分析发现的技能差距，尚未归入具体模块',
        icon: '🎯',
        job_targets: [],
        level: 2,
        level_name: '核心能力',
        prerequisites: [],
        sort_order: 999,
        task_count: orphanCustomCount.total,
        completed_count: orphanCustomCount.completed,
        progress_percentage: orphanCustomCount.total
          ? Math.round((orphanCustomCount.completed / orphanCustomCount.total) * 100)
          : 0,
        is_unlocked: true,
        interview_weak_types: [],
        interview_methodology_count: 0,
        is_custom: true as const,
      });
    }

    return NextResponse.json({ modules: allModules });
  } catch (error) {
    console.error('Skill modules API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
