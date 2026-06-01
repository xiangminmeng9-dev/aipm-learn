import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

const DIRECTION_ROUTES: Record<string, {
  name: string;
  description: string;
  weeks: { week: number; theme: string; focus: string[]; tasks: string[] }[];
  companies: string[];
}> = {
  'Agent/智能体产品经理': {
    name: 'Agent/智能体方向',
    description: 'Agent是AI PM最大的细分方向（253个JD中33个岗位），涉及工具调用、规划执行、记忆系统',
    weeks: [
      { week: 1, theme: 'AI基础与模型理解', focus: ['ai-fundamentals'], tasks: ['学习LLM生成机制与自回归原理', '理解Token与上下文窗口对产品设计的影响', '掌握采样策略(temperature/top_p)对体验的影响'] },
      { week: 2, theme: 'Prompt工程基础', focus: ['prompt-engineering'], tasks: ['结构化Prompt设计(系统Prompt+用户Prompt)', 'Few-shot优化与思维链', '搭建Prompt回归测试套件'] },
      { week: 3, theme: 'Agent架构设计', focus: ['ai-architecture'], tasks: ['ReAct循环：Thought→Action→Observation', 'Function Calling设计：工具定义与参数映射', 'MCP协议学习：模型上下文协议标准'] },
      { week: 4, theme: 'Agent工作流与编排', focus: ['ai-workflow'], tasks: ['多Agent编排模式(主从/对等/层级)', '记忆系统设计(短期/长期/情景记忆)', '工具调用链与错误处理策略'] },
      { week: 5, theme: '对话式AI产品设计', focus: ['conversational-ai'], tasks: ['对话状态管理(FSM建模)', '意图识别体系设计', '知识库运营与RAG应用'] },
      { week: 6, theme: 'Agent效果评估', focus: ['ai-evaluation'], tasks: ['任务完成率评估方法', '工具调用准确率评估', '规划合理性与成本效率评估'] },
      { week: 7, theme: 'Agent产品实战', focus: ['product-design'], tasks: ['用Dify/Coze搭建3个工具以上的Agent原型', '写Agent行为规范文档(含边界case)', '设计Agent评估协议(含Bad Case分类)'] },
      { week: 8, theme: '产品战略与求职', focus: ['product-strategy', 'job-preparation'], tasks: ['Agent产品商业计划(含ROI计算)', '面试准备：Agent设计题+评估题', '作品集整理：Agent原型+评估报告'] },
    ],
    companies: ['百度', '字节跳动'],
  },
  '大模型产品经理': {
    name: '大模型方向',
    description: '大模型PM的核心是"模型能力评估与选型"（253个JD中32个岗位）',
    weeks: [
      { week: 1, theme: '大模型原理与对比', focus: ['ai-fundamentals'], tasks: ['主流大模型5维度对比(效果/成本/延迟/合规/生态)', '设计模型选型决策矩阵', '成本与质量权衡分析'] },
      { week: 2, theme: 'Prompt工程深度', focus: ['prompt-engineering'], tasks: ['思维链Prompt与自我反思', '搭建Prompt回归测试套件', 'Prompt版本管理与灰度发布'] },
      { week: 3, theme: '模型效果评估', focus: ['ai-evaluation'], tasks: ['评估集设计(50+测试用例)', 'Bad Case分类体系与根因分析', 'A/B测试设计(离线+在线)'] },
      { week: 4, theme: '数据驱动优化', focus: ['data-metrics'], tasks: ['数据飞轮设计(行为→数据→模型→体验)', '指标体系搭建(北极星+拆解+护栏)', '用户反馈闭环(显式+隐式)'] },
      { week: 5, theme: '模型商业化', focus: ['ai-commercialization'], tasks: ['API定价策略(按量/包月/阶梯)', '成本优化方案(缓存/量化/路由)', '商业化路径设计(免费→增值→企业)'] },
      { week: 6, theme: '产品战略', focus: ['product-strategy'], tasks: ['模型产品路线图(能力→场景→生态)', '竞争分析(模型层+应用层)', '护城河设计(数据飞轮/网络效应)'] },
      { week: 7, theme: '实战项目', focus: [], tasks: ['设计5个模型以上的选型决策矩阵', '写一份完整的模型效果评估协议', '制定模型版本迁移计划(含回滚策略)'] },
      { week: 8, theme: '求职准备', focus: ['job-preparation'], tasks: ['面试准备：模型选型题+评估题+成本题', '作品集：评估协议+选型矩阵', '模拟面试与复盘'] },
    ],
    companies: ['快手', '通用大模型公司'],
  },
  '对话/客服产品经理': {
    name: '对话/客服方向',
    description: '对话/客服是AI落地最成熟的场景（253个JD中27个岗位），有完整的方法论体系',
    weeks: [
      { week: 1, theme: '产品思维与用户研究', focus: ['pm-thinking', 'user-research'], tasks: ['产品思维模型(需求洞察+场景判断)', '用户调研方法(访谈+行为分析)', '需求分析方法论(5Why+场景还原)'] },
      { week: 2, theme: 'AI技术基础', focus: ['ai-fundamentals'], tasks: ['NLP基础与意图识别原理', '对话系统架构(NLU+DM+NLG)', '模型理解深度边界(第一层+第二层)'] },
      { week: 3, theme: '对话流程设计', focus: ['conversational-ai'], tasks: ['FSM建模多轮对话跳转逻辑', '槽位填充驱动信息采集', '异常流程处理(兜底+重催+合并)'] },
      { week: 4, theme: '意图与知识库', focus: ['conversational-ai'], tasks: ['意图体系设计(一级→二级→实体)', '知识库运营(FAQ→结构化→RAG)', '知识质量治理(时效性+冲突检测)'] },
      { week: 5, theme: '人机协作设计', focus: ['conversational-ai'], tasks: ['转人工策略(主动+被动+规则)', '坐席辅助(推荐答案+知识检索)', '降本增效路径(全人工→AI为主+人工监督)'] },
      { week: 6, theme: '客服指标体系', focus: ['data-metrics'], tasks: ['核心指标(FCR/AHT/CSAT/转人工率)', '成本节约计算(人工替代率)', '指标看板设计(实时+日报+月度复盘)'] },
      { week: 7, theme: '客服AI实战', focus: [], tasks: ['设计10个意图以上的完整对话流', '写一份知识库运营手册', '设计客服AI仪表板(含所有核心指标)'] },
      { week: 8, theme: '商业化与求职', focus: ['ai-commercialization', 'job-preparation'], tasks: ['客服AI ROI计算(成本节约+收入贡献)', '面试准备：对话设计题+指标题', '作品集：对话流+知识库+仪表板'] },
    ],
    companies: ['京东', '通用企业AI'],
  },
  'AIGC/创作产品经理': {
    name: 'AIGC/创作方向',
    description: 'AIGC产品的核心是"多模态理解+创作工作流+内容质量"（253个JD中10个岗位，字节重点）',
    weeks: [
      { week: 1, theme: '产品设计与用户体验', focus: ['pm-thinking', 'product-design'], tasks: ['创作UX设计(灵感→生成→编辑→发布)', '工具类产品设计模式理解', '用户访谈(创作者需求挖掘)'] },
      { week: 2, theme: 'AI技术基础', focus: ['ai-fundamentals'], tasks: ['多模态模型理解(视觉+语言+音频)', '文生图/文生视频原理(Diffusion/Transformer)', 'AIGC工具研究(Midjourney/Runway/Sora)'] },
      { week: 3, theme: '多模态Prompt', focus: ['prompt-engineering'], tasks: ['文生图Prompt设计(主体+风格+构图)', '文生视频Prompt(场景+运动+时长)', '风格控制与一致性保持'] },
      { week: 4, theme: '创作工作流设计', focus: ['ai-workflow'], tasks: ['灵感→生成→编辑→发布的完整链路', 'AI介入点设计(每个环节的AI角色)', '创作者体验优化(降低门槛+提升可控性)'] },
      { week: 5, theme: '内容质量评估', focus: ['ai-evaluation'], tasks: ['美学质量评估(构图/色彩/风格)', '一致性评估(角色/场景/风格)', '安全与版权(内容审核/版权检测)'] },
      { week: 6, theme: 'AIGC商业化', focus: ['ai-commercialization'], tasks: ['创作者生态运营(UGC/PGC/AIGC)', '内容安全审核策略', '商业化路径(工具SaaS/内容平台/API)'] },
      { week: 7, theme: 'AIGC实战', focus: [], tasks: ['设计一个AI创作工作流(文生图或文生视频)', '写一份AIGC输出质量评估框架', '深度评估3个AIGC工具(含对比报告)'] },
      { week: 8, theme: '求职准备', focus: ['job-preparation'], tasks: ['面试准备：创作产品设计题+质量评估题', '作品集：创作工作流+评估框架', 'GTM计划(目标市场+定价+渠道)'] },
    ],
    companies: ['字节跳动'],
  },
  '搜索/推荐产品经理': {
    name: '搜索/推荐方向',
    description: '搜索/推荐PM需要深入理解排序算法、评估体系、数据飞轮（253个JD中17个岗位）',
    weeks: [
      { week: 1, theme: '数据与指标基础', focus: ['data-metrics'], tasks: ['搜索质量指标(相关性/召回率/NDCG/MRR)', '推荐相关性指标(点击率/转化率/多样性)', '需求分析与竞品分析方法论'] },
      { week: 2, theme: '推荐系统原理', focus: ['ai-fundamentals'], tasks: ['协同过滤(用户协同+物品协同)', '内容推荐(特征提取+相似度计算)', '深度学习推荐(DNN/Wide&Deep/DIN)', '冷启动问题与解决方案'] },
      { week: 3, theme: '排序评估', focus: ['ai-evaluation'], tasks: ['离线指标vs在线指标(何时一致何时不一致)', 'A/B测试设计(样本量+显著性+长期效应)', '长期价值评估(短期点击vs长期留存)'] },
      { week: 4, theme: '产品设计与体验', focus: ['product-design'], tasks: ['搜索体验优化(纠错/建议/分面)', '推荐解释性(为什么推荐这个)', '用户控制感(不感兴趣/偏好设置)'] },
      { week: 5, theme: '数据飞轮', focus: ['data-metrics'], tasks: ['用户行为→特征工程→模型优化→体验提升', '数据闭环设计(采集→清洗→训练→评估)', '实时vs批量特征的处理策略'] },
      { week: 6, theme: '产品战略', focus: ['product-strategy'], tasks: ['搜索/推荐产品路线图', '竞争分析(通用vs垂直vs社区)', '差异化定位(内容/场景/体验)'] },
      { week: 7, theme: '搜索/推荐实战', focus: [], tasks: ['设计搜索质量评估协议(含评估集)', '分析一个推荐系统并提出改进建议', '设计一个推荐A/B测试框架'] },
      { week: 8, theme: '求职准备', focus: ['job-preparation'], tasks: ['面试准备：排序评估题+数据飞轮题', '作品集：评估协议+改进方案', '模拟面试与复盘'] },
    ],
    companies: ['小红书', '通用搜索/推荐公司'],
  },
  'AI平台产品经理': {
    name: 'AI平台方向',
    description: '平台PM面对的是开发者而非终端用户，核心是API设计、开发者体验、平台架构（253个JD中16个岗位）',
    weeks: [
      { week: 1, theme: 'AI技术基础', focus: ['ai-fundamentals'], tasks: ['模型服务架构(推理引擎+模型管理)', '推理优化(量化/蒸馏/缓存)', '成本结构(Token计费+GPU成本)'] },
      { week: 2, theme: '平台架构设计', focus: ['ai-architecture'], tasks: ['API网关(限流/鉴权/路由)', '多租户设计(资源隔离+配额管理)', '资源调度(GPU池化+弹性伸缩)', '模型路由(按复杂度分流)'] },
      { week: 3, theme: '工作流编排', focus: ['ai-workflow'], tasks: ['Pipeline设计(串行/并行/条件分支)', '任务调度(优先级+重试+超时)', '错误处理(降级+回滚+告警)'] },
      { week: 4, theme: '技术沟通', focus: ['ai-architecture'], tasks: ['技术可行性评估(成熟度+成本+风险)', '架构图阅读(数据流+调用链+瓶颈)', '与算法团队沟通(效果/成本/风险问题)'] },
      { week: 5, theme: 'API设计与定价', focus: ['ai-commercialization'], tasks: ['RESTful规范(版本管理+向后兼容)', 'API定价模型(按量/包月/阶梯/预留)', '竞品定价对比(AWS/Azure/国内云)'] },
      { week: 6, theme: '开发者体验', focus: ['product-design'], tasks: ['SDK设计(Python/Node/Java)', '文档质量(快速开始+API参考+最佳实践)', '上手流程(5分钟Hello World)', '调试工具(Playground+日志+追踪)'] },
      { week: 7, theme: '平台实战', focus: [], tasks: ['设计AI平台架构图(含所有核心组件)', '写一份API规范文档(含3个核心接口)', '设计API定价模型(含成本测算)'] },
      { week: 8, theme: '战略与求职', focus: ['product-strategy', 'job-preparation'], tasks: ['平台战略(工具→平台→生态)', '生态建设(合作伙伴+开源+社区)', '面试准备：架构设计题+定价题'] },
    ],
    companies: ['快手', '通用AI基础设施公司'],
  },
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({ plan: data || null });
  } catch (err) {
    console.error('Learning plan GET error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { target_role, target_date, weekly_hours } = await request.json();

    // Get user's skill stats
    const { count: totalTasks } = await supabase.from('learning_tasks').select('id', { count: 'exact', head: true });
    const { data: progress } = await supabase.from('learning_progress').select('task_id').eq('user_id', user.id).eq('status', 'completed');
    const completedCount = progress?.length ?? 0;

    const daysUntilTarget = target_date
      ? Math.max(1, Math.ceil((new Date(target_date).getTime() - Date.now()) / 86400000))
      : 30;
    const totalWeeks = Math.min(Math.ceil(daysUntilTarget / 7), 8);

    // Get skill modules for context
    const { data: modules } = await supabase.from('skill_modules').select('id, name, level, level_name').order('level').order('name');
    const moduleNames = (modules ?? []).slice(0, 8).map(m => m.name).join('、');

    // Match direction route
    const matchedRoute = Object.entries(DIRECTION_ROUTES).find(([key]) =>
      target_role?.includes(key) || target_role?.includes(key.split('/')[0])
    );

    if (matchedRoute) {
      const [routeKey, route] = matchedRoute;
      const routeWeeks = route.weeks.slice(0, Math.max(totalWeeks, 8));

      const planData = {
        weeks: routeWeeks.map(w => ({
          week: w.week,
          theme: w.theme,
          tasks: w.tasks.map((t, idx) => ({
            day: idx + 1,
            title: t,
            description: `重点模块：${w.focus.join('、') || '综合实战'}`,
            module: w.focus[0] || '综合',
            estimated_minutes: Math.round((weekly_hours || 10) * 60 / w.tasks.length),
          })),
        })),
        summary: `${route.name}学习计划。${route.description}。对齐公司：${route.companies.join('、')}。每周${weekly_hours || 10}小时，共${totalWeeks}周。`,
        direction: routeKey,
        directionDescription: route.description,
        alignedCompanies: route.companies,
      };

      const { data: existing } = await supabase
        .from('learning_plans').select('id').eq('user_id', user.id).maybeSingle();

      if (existing) {
        await supabase.from('learning_plans').update({
          target_role: target_role || routeKey,
          target_date: target_date || null,
          weekly_hours: weekly_hours || 10,
          plan_data: planData,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      } else {
        await supabase.from('learning_plans').insert({
          user_id: user.id,
          target_role: target_role || routeKey,
          target_date: target_date || null,
          weekly_hours: weekly_hours || 10,
          plan_data: planData,
        });
      }

      return NextResponse.json({ plan: planData, success: true });
    }

    const prompt = `你是AI PM学习教练，为"${target_role || 'AI产品经理'}"制定${totalWeeks}周学习计划(markdown格式不必JSON)。

## 第1周：主题XXX
- 第1天：任务名 — 做什么（30分钟）
- 第2天：任务名 — 做什么（30分钟）
...

## 第2周：主题XXX
...

## 总结
计划总结2-3句话。可选模块：${moduleNames}。当前完成${completedCount}/${totalTasks}个任务。每周${weekly_hours || 10}小时。`;

    const result = await generateText(prompt, {
      model: 'haiku',
      maxTokens: 1500,
      system: '你是学习规划专家。用markdown格式输出周计划。## 第N周作为标题，- 列表表示任务。不要用代码块。',
    });

    // Parse markdown into structured weeks
    const sections = result.split(/## 第(\d+)周/);
    const weeks: { week: number; theme: string; tasks: { day: number; title: string; description: string; module: string; estimated_minutes: number }[] }[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      const weekNum = parseInt(sections[i]);
      const content = sections[i + 1] || '';
      const lines = content.split('\n').filter(l => l.trim());
      const theme = lines[0]?.replace(/^[：:]*\s*/, '').replace(/^主题[:：]?\s*/, '').trim() || `第${weekNum}周`;

      const tasks = lines.filter(l => l.match(/^[-*•]\s/) || l.match(/^\d+[\.、]/)).slice(0, 7).map((l, idx) => {
        const text = l.replace(/^[-*•\d+\.\、]\s*/, '').trim();
        const parts = text.split(/[—–-]\s*/);
        return {
          day: idx + 1,
          title: parts[0]?.trim() || text,
          description: parts[1]?.trim() || '',
          module: moduleNames.split('、')[Math.floor(Math.random() * Math.min(moduleNames.split('、').length, 1))] || '综合',
          estimated_minutes: 30,
        };
      });

      if (tasks.length > 0) weeks.push({ week: weekNum, theme, tasks });
    }

    const summaryMatch = result.match(/##\s*总结[\s\S]*$/i);
    const summary = summaryMatch?.[0]?.replace(/##\s*总结\s*/i, '').trim() || `为期${totalWeeks}周的学习计划`;

    const planData = { weeks: weeks.slice(0, totalWeeks), summary };

    const { data: existing } = await supabase
      .from('learning_plans').select('id').eq('user_id', user.id).maybeSingle();

    if (existing) {
      await supabase.from('learning_plans').update({
        target_role: target_role || 'AI产品经理',
        target_date: target_date || null,
        weekly_hours: weekly_hours || 10,
        plan_data: planData,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('learning_plans').insert({
        user_id: user.id,
        target_role: target_role || 'AI产品经理',
        target_date: target_date || null,
        weekly_hours: weekly_hours || 10,
        plan_data: planData,
      });
    }

    return NextResponse.json({ plan: planData, success: true });
  } catch (err) {
    console.error('Learning plan POST error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
