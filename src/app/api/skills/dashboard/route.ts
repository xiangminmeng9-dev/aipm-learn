import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeSkill } from '@/lib/ai/skill-normalizer';

function getPositionCategory(positionName: string): string {
  const pos = (positionName || '').toLowerCase();
  if (pos.includes('产品') || pos.includes('pm') || pos.includes('product')) return '产品经理';
  if (pos.includes('运营') || pos.includes('operation')) return '运营';
  if (pos.includes('销售') || pos.includes('商务') || pos.includes('bd')) return '销售';
  if (pos.includes('开发') || pos.includes('工程师') || pos.includes('技术')) return '技术';
  if (pos.includes('设计') || pos.includes('ui') || pos.includes('ux')) return '设计';
  if (pos.includes('数据') || pos.includes('分析') || pos.includes('算法')) return '数据';
  if (pos.includes('市场') || pos.includes('营销')) return '市场';
  if (pos.includes('人力') || pos.includes('hr')) return '人力';
  if (pos.includes('财务') || pos.includes('会计')) return '财务';
  return '其他';
}

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

    // 并行查询所有数据
    const [
      systemModulesRes,
      userModulesRes,
      systemTasksRes,
      userTasksRes,
      customTasksRes,
      systemProgressRes,
      userProgressRes,
      jdAnalysesRes,
      learningPlansRes,
      learningPlanCountRes,
      aiPathCountRes,
      jdTotalCountRes,
    ] = await Promise.all([
      supabase.from('skill_modules').select('id, name, level'),
      supabase.from('user_skill_modules').select('id, name, level').eq('user_id', user.id),
      supabase.from('learning_tasks').select('id, module_id'),
      supabase.from('user_module_tasks').select('id, module_id'),
      supabase.from('user_custom_tasks').select('id, module_id, status').eq('user_id', user.id),
      supabase.from('learning_progress').select('id, status, task_id, completed_at, created_at').eq('user_id', user.id),
      supabase.from('user_task_progress').select('id, status, task_id, completed_at, created_at').eq('user_id', user.id),
      supabase.from('jd_analyses').select('id, gaps, extracted_skills, created_at, company_name, position_name').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('learning_plans').select('id, title, status, progress').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('learning_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('ai_learning_paths').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('jd_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

    const systemModules = systemModulesRes.data || [];
    const userModules = userModulesRes.data || [];
    const allModules = [...systemModules, ...userModules.map(m => ({ ...m, is_user_module: true }))];
    const systemTasks = systemTasksRes.data || [];
    const userTasks = userTasksRes.data || [];
    const customTasks = customTasksRes.data || [];
    const allTasks = [...systemTasks, ...userTasks];
    const learningProgress = [...(systemProgressRes.data || []), ...(userProgressRes.data || [])];
    const jdAnalyses = jdAnalysesRes.data || [];
    const learningPlans = learningPlansRes.data || [];

    // 统计任务
    const moduleTaskMap = new Map<string, { total: number; completed: number }>();
    for (const task of allTasks) {
      const existing = moduleTaskMap.get(task.module_id) || { total: 0, completed: 0 };
      existing.total += 1;
      moduleTaskMap.set(task.module_id, existing);
    }

    // JD差距任务
    const jdGapTasksWithoutModule = customTasks.filter(t => !t.module_id);
    const jdGapTasksWithModule = customTasks.filter(t => t.module_id);
    moduleTaskMap.set('__jd_gaps__', {
      total: jdGapTasksWithoutModule.length,
      completed: jdGapTasksWithoutModule.filter(t => t.status === 'completed').length
    });
    for (const task of jdGapTasksWithModule) {
      const existing = moduleTaskMap.get(task.module_id) || { total: 0, completed: 0 };
      existing.total += 1;
      if (task.status === 'completed') existing.completed += 1;
      moduleTaskMap.set(task.module_id, existing);
    }

    // 完成进度
    const completedTaskIds = new Set(learningProgress.filter(p => p.status === 'completed').map(p => p.task_id));
    for (const task of allTasks) {
      if (completedTaskIds.has(task.id)) {
        const existing = moduleTaskMap.get(task.module_id) || { total: 0, completed: 0 };
        existing.completed += 1;
        moduleTaskMap.set(task.module_id, existing);
      }
    }

    // 按板块统计
    const levelStats = [
      { level: 1, name: '基础入门', total: 0, completed: 0, color: '#34c759' },
      { level: 2, name: '核心能力', total: 0, completed: 0, color: '#ff9500' },
      { level: 3, name: '进阶专项', total: 0, completed: 0, color: '#af52de' },
      { level: 4, name: '实战综合', total: 0, completed: 0, color: '#ff3b30' },
    ];

    for (const mod of allModules) {
      const level = mod.level || 1;
      const stats = moduleTaskMap.get(mod.id) || { total: 0, completed: 0 };
      if (level >= 1 && level <= 4) {
        levelStats[level - 1].total += stats.total;
        levelStats[level - 1].completed += stats.completed;
      }
    }

    const jdGapStats = moduleTaskMap.get('__jd_gaps__') || { total: 0, completed: 0 };
    levelStats[1].total += jdGapStats.total;
    levelStats[1].completed += jdGapStats.completed;

    const completedProgressCount = learningProgress.filter(p => p.status === 'completed').length;
    const notStartedCount = learningProgress.filter(p => p.status === 'not_started').length;
    const inProgressCount = learningProgress.filter(p => p.status === 'in_progress').length;

    // 计算总任务数（系统任务 + 用户模块任务 + JD差距任务）
    const totalSystemTasks = systemTasks.length;
    const totalUserTasks = userTasks.length;
    const totalCustomTasks = customTasks.length;
    const totalTasksCount = totalSystemTasks + totalUserTasks + totalCustomTasks;

    // 待学习任务 = 总任务数 - 已完成进度数 - 进行中进度数
    const totalPendingTasks = totalTasksCount - completedProgressCount - inProgressCount;

    // 技能完成趋势
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const trendMap = new Map<string, number>();
    for (const p of learningProgress) {
      if (p.completed_at) {
        const date = p.completed_at.slice(0, 10);
        trendMap.set(date, (trendMap.get(date) || 0) + 1);
      }
    }
    const skillCompletionTrend = Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getTime() - (days - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, count: trendMap.get(dateStr) || 0 };
    });

    // 公司分布（归一化：未明确/未提供等统一为null，展示时排除）
    const unknownPatterns = /^(未|无|没有|暂无|未提及|未明确|未提供|未注明|未填写|none|null|n\/a|—|-)$/i;
    const companyMap = new Map<string, number>();
    for (const j of jdAnalyses) {
      const raw = (j.company_name || '').trim();
      const company = !raw || unknownPatterns.test(raw) ? null : raw;
      if (company) {
        companyMap.set(company, (companyMap.get(company) || 0) + 1);
      }
    }
    const unknownCompanyCount = jdAnalyses.length - Array.from(companyMap.values()).reduce((a, b) => a + b, 0);
    const companyDistribution = Array.from(companyMap.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count);
    if (unknownCompanyCount > 0) {
      companyDistribution.push({ company: '未提及公司', count: unknownCompanyCount });
    }

    // 按职位类别分组的公司分布
    const companyByCategory: Record<string, { company: string; count: number }[]> = {};
    for (const j of jdAnalyses) {
      const category = getPositionCategory(j.position_name);
      if (!companyByCategory[category]) {
        companyByCategory[category] = [];
      }
    }
    for (const category of Object.keys(companyByCategory)) {
      const catJds = jdAnalyses.filter(j => getPositionCategory(j.position_name) === category);
      const catCompanyMap = new Map<string, number>();
      for (const j of catJds) {
        const raw = (j.company_name || '').trim();
        const company = !raw || unknownPatterns.test(raw) ? null : raw;
        if (company) {
          catCompanyMap.set(company, (catCompanyMap.get(company) || 0) + 1);
        }
      }
      const catUnknown = catJds.length - Array.from(catCompanyMap.values()).reduce((a, b) => a + b, 0);
      const catDist = Array.from(catCompanyMap.entries())
        .map(([company, count]) => ({ company, count }))
        .sort((a, b) => b.count - a.count);
      if (catUnknown > 0) {
        catDist.push({ company: '未提及公司', count: catUnknown });
      }
      companyByCategory[category] = catDist;
    }

    // 职位类别分布
    const categoryMap = new Map<string, number>();
    for (const j of jdAnalyses) {
      const category = getPositionCategory(j.position_name);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 技能统计（使用共享的归一化模块）
    // Add company tracking
    const allSkillsMap = new Map<string, { count: number; category: string; companies: string[]; originalNames: Set<string> }>();
    for (const j of jdAnalyses) {
      const skills = (j.extracted_skills as Array<{ skill_name: string; category?: string }>) || [];
      const seenInThisJd = new Set<string>();
      for (const s of skills) {
        const skillName = s.skill_name || '';
        if (!skillName) continue;
        const canonical = normalizeSkill(skillName);
        if (seenInThisJd.has(canonical)) continue;
        seenInThisJd.add(canonical);
        const existing = allSkillsMap.get(canonical) || { count: 0, category: s.category || '未分类', companies: [], originalNames: new Set<string>() };
        existing.count += 1;
        existing.originalNames.add(skillName);
        if (j.company_name && !existing.companies.includes(j.company_name)) {
          existing.companies.push(j.company_name);
        }
        allSkillsMap.set(canonical, existing);
      }
    }

    const commonSkills = Array.from(allSkillsMap.entries())
      .map(([skill, data]) => ({ skill, count: data.count, category: data.category, companies: data.companies.slice(0, 3) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // 按职位类别分组技能（每个类别独立统计频次）
    const categorySkillMaps: Record<string, Map<string, { count: number; category: string; companies: string[] }>> = {};
    for (const j of jdAnalyses) {
      const category = getPositionCategory(j.position_name);
      const skills = (j.extracted_skills as Array<{ skill_name: string; category?: string }>) || [];
      if (!categorySkillMaps[category]) {
        categorySkillMaps[category] = new Map();
      }
      const seenInThisJd = new Set<string>();
      for (const s of skills) {
        const skillName = s.skill_name || '';
        if (!skillName) continue;
        const canonical = normalizeSkill(skillName);
        if (seenInThisJd.has(canonical)) continue;
        seenInThisJd.add(canonical);
        const catMap = categorySkillMaps[category];
        const existing = catMap.get(canonical) || { count: 0, category: s.category || '未分类', companies: [] };
        existing.count += 1;
        if (j.company_name && !existing.companies.includes(j.company_name)) {
          existing.companies.push(j.company_name);
        }
        catMap.set(canonical, existing);
      }
    }

    // 构建 skillsByCategory：all 用全局统计，每个类别用该类别的独立统计
    const skillsByCategory: Record<string, { skill: string; count: number; category?: string; companies?: string[] }[]> = {
      all: commonSkills,
    };
    for (const [cat, catMap] of Object.entries(categorySkillMaps)) {
      skillsByCategory[cat] = Array.from(catMap.entries())
        .map(([skill, data]) => ({ skill, count: data.count, category: data.category, companies: data.companies.slice(0, 3) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);
    }

    // 覆盖度
    const moduleNames = new Set(allModules.map(m => m.name.toLowerCase()));
    const coveredSkills = commonSkills.filter(s =>
      moduleNames.has(s.skill.toLowerCase()) ||
      allModules.some(m => m.name.toLowerCase().includes(s.skill.toLowerCase()))
    );
    const coverageRate = commonSkills.length > 0 ? Math.round((coveredSkills.length / commonSkills.length) * 100) : 0;

    // 环比
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
    const thisWeekProgress = learningProgress.filter(p => p.created_at >= weekAgo).length;
    const lastWeekProgress = learningProgress.filter(p => p.created_at >= twoWeeksAgo && p.created_at < weekAgo).length;
    const progressChange = lastWeekProgress > 0 ? Math.round(((thisWeekProgress - lastWeekProgress) / lastWeekProgress) * 100) : (thisWeekProgress > 0 ? 100 : 0);
    const thisWeekJd = jdAnalyses.filter(j => j.created_at >= weekAgo).length;
    const lastWeekJd = jdAnalyses.filter(j => j.created_at >= twoWeeksAgo && j.created_at < weekAgo).length;
    const jdChange = lastWeekJd > 0 ? Math.round(((thisWeekJd - lastWeekJd) / lastWeekJd) * 100) : (thisWeekJd > 0 ? 100 : 0);

    return NextResponse.json({
      stats: {
        system_modules: systemModules.length,
        pending_tasks: totalPendingTasks,
        total_tasks: totalTasksCount,
        jd_analysis_count: jdTotalCountRes.count || 0,
        jd_gaps_count: jdAnalyses.filter(j => j.gaps && j.gaps.length > 0).length,
        learning_plan_count: learningPlanCountRes.count || 0,
        ai_path_count: aiPathCountRes.count || 0,
        tasks_change: progressChange,
        jd_change: jdChange,
        skill_completion_trend: skillCompletionTrend,
        company_distribution: companyDistribution,
        company_by_category: companyByCategory,
        plan_progress: learningPlans.map(p => ({ id: p.id, title: p.title, status: p.status, progress: p.progress || 0 })),
        common_skills: commonSkills,
        skills_by_category: skillsByCategory,
        category_distribution: categoryDistribution,
        funnel_stages: [
          { stage: '待学习', count: totalPendingTasks },
          { stage: '学习中', count: inProgressCount },
          { stage: '已完成', count: completedProgressCount },
        ],
        coverage_rate: coverageRate,
        covered_skills: [
          ...coveredSkills.map(s => ({ skill: s.skill, count: s.count, covered: true })),
          ...commonSkills.filter(s => !coveredSkills.includes(s)).map(s => ({ skill: s.skill, count: s.count, covered: false })),
        ],
        level_stats: levelStats,
      },
    });
  } catch (error) {
    console.error('Skills dashboard error:', error);
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 });
  }
}