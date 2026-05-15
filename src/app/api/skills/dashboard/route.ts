import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    ] = await Promise.all([
      supabase.from('skill_modules').select('id, name, level'),
      supabase.from('user_skill_modules').select('id, name, level').eq('user_id', user.id),
      supabase.from('learning_tasks').select('id, module_id'),
      supabase.from('user_module_tasks').select('id, module_id'),
      supabase.from('user_custom_tasks').select('id, module_id, status').eq('user_id', user.id),
      supabase.from('learning_progress').select('id, status, task_id, completed_at, created_at').eq('user_id', user.id),
      supabase.from('user_task_progress').select('id, status, task_id, completed_at, created_at').eq('user_id', user.id),
      supabase.from('jd_analyses').select('id, gaps, extracted_skills, created_at, company_name, position_name').eq('user_id', user.id).gte('created_at', cutoffDate).order('created_at', { ascending: false }),
      supabase.from('learning_plans').select('id, title, status, progress').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('learning_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('ai_learning_paths').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
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

    // 公司分布
    const companyMap = new Map<string, number>();
    for (const j of jdAnalyses) {
      if (j.company_name) {
        companyMap.set(j.company_name, (companyMap.get(j.company_name) || 0) + 1);
      }
    }
    const companyDistribution = Array.from(companyMap.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 职位类别分布
    const categoryMap = new Map<string, number>();
    for (const j of jdAnalyses) {
      const category = getPositionCategory(j.position_name);
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 技能语义归一化映射：同义技能统一到标准名称
    const skillAliases: Record<string, string[]> = {
      'Prompt Engineering': ['提示词工程', '提示词设计', 'Prompt设计', 'Prompt优化', '提示词优化', 'Prompt撰写', '提示词编写'],
      '用户研究': ['用户调研', '用户访谈', '用户需求分析', '用户洞察', '用户理解'],
      '数据分析': ['数据驱动', '数据驱动决策', '数据思维', '数据敏感度', '数据运营'],
      'A/B测试': ['AB测试', 'A/B实验', '实验设计', '灰度实验', '分流实验'],
      '产品思维': ['产品意识', '产品sense', '产品感', '产品方法论'],
      '需求分析': ['需求挖掘', '需求梳理', '需求定义', '需求管理', '需求拆解'],
      'AI产品': ['AI产品经理', 'AI PM', '人工智能产品', '智能产品', 'AI应用'],
      '大模型': ['LLM', '大语言模型', '大语言模型原理', '大模型应用', 'LLM应用'],
      'RAG': ['检索增强生成', '检索增强', '知识检索', 'RAG架构'],
      'Agent': ['AI Agent', '智能体', 'AI助手', '智能代理', 'Agent架构'],
      'MLOps': ['模型部署', '模型运维', 'ML工程', '机器学习工程'],
      '交互设计': ['用户体验设计', 'UX设计', 'UI/UX', '交互体验', '体验设计'],
      'PRD': ['产品需求文档', '需求文档', 'PRD撰写', 'PRD编写'],
      '项目管理': ['项目推进', '项目协调', '项目落地', '项目交付'],
      '竞品分析': ['竞品研究', '竞品调研', '竞争分析', '竞品对标'],
      'SQL': ['SQL查询', 'SQL分析', '数据库查询'],
      '商业分析': ['商业洞察', '商业模式', '商业sense', '商业理解'],
      '沟通协作': ['跨部门协作', '团队协作', '沟通能力', '跨团队沟通', '协作能力'],
      '技术理解': ['技术sense', '技术判断', '技术评估', '技术选型', '技术可行性'],
      '产品策略': ['产品规划', '产品路线图', '产品方向', '战略规划'],
      '指标体系': ['指标搭建', '指标设计', '度量体系', '数据指标'],
      '微调': ['Fine-tuning', '模型微调', 'finetune', '模型训练'],
      '多模态': ['多模态模型', '多模态交互', '多模态理解', '跨模态'],
      'API设计': ['接口设计', 'API', 'API规划', '开放平台'],
    };

    // 构建反向映射：每个别名 -> 标准名称
    const aliasToCanonical = new Map<string, string>();
    for (const [canonical, aliases] of Object.entries(skillAliases)) {
      aliasToCanonical.set(canonical.toLowerCase(), canonical);
      for (const alias of aliases) {
        aliasToCanonical.set(alias.toLowerCase(), canonical);
      }
    }

    // 归一化技能名称：先查别名表，再做模糊匹配
    const normalizeSkill = (name: string): string => {
      const lower = name.toLowerCase();
      // 精确匹配别名
      if (aliasToCanonical.has(lower)) return aliasToCanonical.get(lower)!;
      // 包含匹配：技能名包含别名或别名包含技能名
      for (const [alias, canonical] of aliasToCanonical) {
        if (lower.includes(alias) || alias.includes(lower)) return canonical;
      }
      return name;
    };

    // 技能统计（语义归一化后）
    const allSkillsMap = new Map<string, { count: number; category: string; companies: string[]; originalNames: Set<string> }>();
    for (const j of jdAnalyses) {
      const skills = (j.extracted_skills as Array<{ skill_name: string; category?: string }>) || [];
      for (const s of skills) {
        const skillName = s.skill_name || '';
        if (!skillName) continue;
        const canonical = normalizeSkill(skillName);
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
      .slice(0, 20);

    // 按职位类别分组技能
    const skillsByCategory: Record<string, { skill: string; count: number; category?: string; companies?: string[] }[]> = { all: commonSkills };
    for (const j of jdAnalyses) {
      const category = getPositionCategory(j.position_name);
      const skills = (j.extracted_skills as Array<{ skill_name: string; category?: string }>) || [];
      for (const s of skills) {
        const skillName = s.skill_name || '';
        if (!skillName) continue;
        const canonical = normalizeSkill(skillName);
        const existing = allSkillsMap.get(canonical);
        if (!existing) continue;
        if (!skillsByCategory[category]) {
          skillsByCategory[category] = [];
        }
        if (!skillsByCategory[category].some(cs => cs.skill === canonical)) {
          skillsByCategory[category].push({
            skill: canonical,
            count: existing.count,
            category: existing.category,
            companies: existing.companies.slice(0, 3),
          });
        }
      }
    }
    // 每个类别内按频次排序
    for (const cat of Object.keys(skillsByCategory)) {
      if (cat !== 'all') {
        skillsByCategory[cat].sort((a, b) => b.count - a.count);
      }
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
        jd_analysis_count: jdAnalyses.length,
        jd_gaps_count: jdAnalyses.filter(j => j.gaps && j.gaps.length > 0).length,
        learning_plan_count: learningPlanCountRes.count || 0,
        ai_path_count: aiPathCountRes.count || 0,
        tasks_change: progressChange,
        jd_change: jdChange,
        skill_completion_trend: skillCompletionTrend,
        company_distribution: companyDistribution,
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