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

    // 技能语义归一化映射：同义技能统一到标准名称
    const skillAliases: Record<string, string[]> = {
      '大模型应用与落地': ['大模型应用落地', '大模型产品策略', '大模型能力与应用场景', '大语言模型', 'LLM应用', 'LLM', '大模型', 'AI对话与大模型应用落地', '大模型落地', '大模型应用', 'LLM应用落地', '大模型技术理解', '大模型技术', 'LLM技术', '生成式AI应用', '生成式AI', 'AIGC应用', 'AIGC', 'AI大模型', '大语言模型应用'],
      'Agent搭建': ['Agent探索与设计', 'Agent架构设计', 'AI Agent搭建', 'AI Agent', 'Agentic产品设计', 'Agent', '智能体', 'AI Agent认知与洞见', 'Agent设计', 'Agent开发', '智能体设计', 'AI智能体', 'Agent应用', '智能体应用'],
      '协作能力': ['跨团队协作与项目推进', '跨团队协作', '跨团队协同与资源协调', '沟通与协调能力', '跨部门协作', '团队协作', '沟通能力', '跨团队沟通', '协作能力', '团队沟通', '跨部门沟通', '资源协调', '团队协同', '组织协调'],
      '数据驱动': ['数据分析与指标驱动', '数据分析与指标体系搭建', '数据思维与数据驱动决策', '数据驱动与数据分析', '数据分析', '数据驱动决策', '数据思维', '数据敏感度', '数据运营', '数据分析基础', '数据驱动产品', '数据驱动运营', '数据化运营', '数据洞察', '数据判断'],
      'AI产品设计': ['AI产品', 'AI产品经理', 'AI PM', '人工智能产品', '智能产品', 'AI应用', 'AI智能客服产品设计', 'AI聊天机器人/对话体验设计', 'AI对话产品设计', 'AI技术认知与行业洞察', 'AI产品规划', 'AI产品思维', 'AI应用设计', '智能化产品设计', 'AI产品落地', 'AI原生产品', 'AI-First产品'],
      'Prompt Engineering': ['提示词工程', '提示词设计', 'Prompt设计', 'Prompt优化', '提示词优化', 'Prompt撰写', '提示词编写', 'Prompt工程', 'Prompt调优', '提示词调优', '提示词', 'Prompt', 'Prompt Engineering'],
      '用户研究': ['用户调研', '用户访谈', '用户需求分析', '用户洞察', '用户理解', '用户体验洞察', '用户同理心与价值平衡', '用户分析', '用户画像', '用户行为分析', '用户需求挖掘', '用户场景分析'],
      'A/B测试': ['AB测试', 'A/B实验', '实验设计', '灰度实验', '分流实验', 'A/B测试', '实验分析', '灰度发布', '实验驱动', '效果验证'],
      '产品思维': ['产品意识', '产品sense', '产品感', '产品方法论', '产品思考', '产品逻辑', '产品判断力'],
      '需求分析': ['需求挖掘', '需求梳理', '需求定义', '需求管理', '需求拆解', '需求沟通与管理', '业务需求分析与策略制定', '需求理解', '需求洞察', '需求转化', '需求优先级'],
      '交互设计': ['用户体验设计', 'UX设计', 'UI/UX', '交互体验', '体验设计', '人机协同体验设计', '人机协同设计', '交互逻辑', '体验优化', 'UX', 'UI设计', '界面设计'],
      'PRD': ['产品需求文档', '需求文档', 'PRD撰写', 'PRD编写', 'PRD设计', '需求规格', '产品文档'],
      '项目管理': ['项目推进', '项目协调', '项目落地', '项目交付', '产品实施与推广', '项目规划', '项目执行', '项目跟踪', '项目管控'],
      '竞品分析': ['竞品研究', '竞品调研', '竞争分析', '竞品对标', '竞品洞察', '竞争策略', '竞品追踪', '市场竞品'],
      'SQL': ['SQL查询', 'SQL分析', '数据库查询', 'SQL编写', 'SQL能力', '数据库分析'],
      '商业分析': ['商业洞察', '商业模式', '商业sense', '商业理解', '商业化与业务增长驱动', '经营诊断与策略制定', '商业分析能力', '商业化', '商业判断', '业务分析', '商业逻辑'],
      '技术理解': ['技术sense', '技术判断', '技术评估', '技术选型', '技术可行性', 'AI前沿技术跟踪应用', '技术认知', '技术理解力', '技术思维', '技术背景', '技术沟通', '技术方案评估'],
      '产品策略': ['产品规划', '产品路线图', '产品方向', '战略规划', '产品0到1建设与迭代规划', '产品全生命周期管理', '产品战略', '产品定位', '产品方向规划', '产品迭代规划', '产品演进'],
      '指标体系': ['指标搭建', '指标设计', '度量体系', '数据指标', '指标体系搭建', '指标规划', '指标定义', '北极星指标', '核心指标'],
      '微调': ['Fine-tuning', '模型微调', 'finetune', '模型训练', '模型微调与训练', 'SFT', 'RL', '微调训练', '模型调优', '参数调优'],
      '多模态': ['多模态模型', '多模态交互', '多模态理解', '跨模态', '多模态应用', '多模态AI', '多模态设计'],
      'API设计': ['接口设计', 'API', 'API规划', '开放平台', 'API接口', '接口规划', 'API管理', '开放API'],
      'RAG': ['检索增强生成', '检索增强', '知识检索', 'RAG架构', 'RAG应用', '知识库检索', 'RAG设计', '检索增强生成技术'],
      'B端产品': ['B端产品设计', '商家端B端产品建设', '商家后台', 'SaaS系统', '复杂业务中台', '复杂B端系统建设', 'B端', '企业级产品', 'SaaS产品', 'B端系统', '后台产品', '中台产品'],
      '行业认知': ['电商行业认知', '生活服务行业认知', '行业业务分析', '行业洞察', '行业理解', '行业分析', '行业经验', '垂直行业', '行业知识'],
      '快速学习': ['快速学习与自驱力', '新技术学习与动手实践能力', '自驱力', '学习能力', '持续学习', '自我驱动', '学习敏锐度'],
      '平台化建设': ['平台化建设与资产沉淀', '平台化', '资产沉淀', '平台设计', '平台架构', '平台产品', '平台能力'],
      '模型评测': ['模型应用评估与量化分析', '模型训练与评测', 'AI评测', '模型评估', '模型效果评估', '评测体系', 'AI模型评测', '效果评测'],
      '产品运营': ['运营策略', '用户运营', '增长运营', '产品增长', '运营规划', '运营分析', '增长策略', '用户增长', 'Growth'],
      'AI伦理': ['AI安全', 'AI合规', '算法伦理', 'AI治理', '负责任AI', 'AI风险', '模型安全', '内容安全'],
      '知识图谱': ['知识图谱构建', '图谱应用', '知识库建设', '知识管理'],
      '对话系统': ['对话设计', '对话流设计', '对话体验', '对话式AI', '聊天机器人', 'Chatbot', '智能客服', '对话交互'],
      'Python': ['Python编程', 'Python开发', 'Python能力', '编程能力', '编程基础'],
      'NLP': ['自然语言处理', '文本分析', '语义理解', 'NLP技术', '自然语言理解'],
      '推荐系统': ['推荐算法', '推荐策略', '个性化推荐', '推荐引擎', '推荐产品设计'],
    };

    // 构建反向映射：每个别名 -> 标准名称
    const aliasToCanonical = new Map<string, string>();
    for (const [canonical, aliases] of Object.entries(skillAliases)) {
      aliasToCanonical.set(canonical.toLowerCase(), canonical);
      for (const alias of aliases) {
        aliasToCanonical.set(alias.toLowerCase(), canonical);
      }
    }

    // 为模糊匹配提取每个标准技能的核心关键词
    // 按关键词长度降序排列，优先匹配更具体的关键词，避免短词误匹配
    const fuzzyRules: Array<{ canonical: string; keyword: string }> = [];
    for (const [canonical, aliases] of Object.entries(skillAliases)) {
      // 从标准名和别名中提取核心词（去掉连接词、括号等）
      const allNames = [canonical, ...aliases];
      for (const name of allNames) {
        const parts = name
          .replace(/[与和及]/g, '|')
          .replace(/[（）()]/g, '|')
          .split('|')
          .map(s => s.trim())
          .filter(s => s.length >= 2);
        for (const part of parts) {
          fuzzyRules.push({ canonical, keyword: part });
        }
      }
    }
    // 按关键词长度降序，长词优先匹配
    fuzzyRules.sort((a, b) => b.keyword.length - a.keyword.length);

    // 归一化技能名称：精确匹配 → 模糊子串匹配
    const normalizeSkill = (name: string): string => {
      const lower = name.toLowerCase();
      // 1. 精确匹配
      const exact = aliasToCanonical.get(lower);
      if (exact) return exact;

      // 2. 模糊匹配：输入包含关键词（长词优先，避免短词误匹配）
      for (const { canonical, keyword } of fuzzyRules) {
        if (lower.includes(keyword.toLowerCase())) return canonical;
      }

      // 3. 反向匹配：标准技能名包含输入（如输入 "Agent" 被标准 "Agent搭建" 包含）
      for (const [canonicalName, aliases] of Object.entries(skillAliases)) {
        const allNames = [canonicalName, ...aliases];
        for (const alias of allNames) {
          if (alias.toLowerCase().includes(lower) && lower.length >= 2) return canonicalName;
        }
      }

      return name;
    };

    // 技能统计（语义归一化后，每条JD中同一技能只算1次）
    const allSkillsMap = new Map<string, { count: number; category: string; companies: string[]; originalNames: Set<string> }>();
    for (const j of jdAnalyses) {
      const skills = (j.extracted_skills as Array<{ skill_name: string; category?: string }>) || [];
      // 先归一化，再用Set去重——同一条JD中同一标准技能只算1次
      const seenInThisJd = new Set<string>();
      for (const s of skills) {
        const skillName = s.skill_name || '';
        if (!skillName) continue;
        const canonical = normalizeSkill(skillName);
        if (seenInThisJd.has(canonical)) continue; // 同一条JD中重复出现只算1次
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