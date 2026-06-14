import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export const maxDuration = 30;

const KG_QA_SYSTEM_PROMPT = `你是AI PM技能图谱分析助手。你拥有从JD（岗位描述）分析中提炼出的技能知识图谱数据，包含公司、归一化技能、来源技能、职位、学习模块等节点和它们之间的关系。

核心原则：
1. 基于图谱数据回答，不要编造不存在的信息
2. 回答要像专业猎头/职业顾问的分析，不是简单罗列数据
3. 利用节点属性（频次、重要性、覆盖状态、关联公司等）生成有深度的洞察
4. 如果问题涉及比较，要做差异分析而不是分别列出
5. 来源技能能反映行业真实用词，可以引用来说明某个技能在市场上的具体叫法

回答格式要求：
1. 纯文本，不要用markdown格式（不要**加粗**、#标题、- 列表符号等）
2. 用中文标点和换行组织，数字用阿拉伯数字
3. 技能排序时按频次从高到低

回答结构建议（根据问题灵活调整）：
1. 直接回答用户问题
2. 数据支撑：列出关键技能及其属性（频次、重要性、覆盖状态）
3. 洞察分析（最重要的部分）：
   - 核心趋势和特征
   - 对求职者的具体建议
   - 行业差异或公司差异
   - 来源技能反映的市场用词偏好

示例回答风格（仅作参考，不要照搬结构）：

字节跳动最看重Agent搭建能力（13次，重要性高），这和抖音、飞书全线产品都在做AI Agent有关。其次是Prompt Engineering（11次，高）和RAG（8次，中），说明字节对AI核心技术能力要求很扎实。值得注意的是，数据驱动虽然只出现6次，但在字节的JD里经常用"数据驱动决策""数据分析驱动产品迭代"等不同表述，说明这不是一个可选项而是基础门槛。未覆盖的技能有3个，其中Prompt Engineering是最需要补的——作为Agent和RAG的上游能力，掌握它对字节的机会最大。`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { query, nodes, edges } = await request.json();
    if (!query?.trim()) return NextResponse.json({ error: '请输入问题' }, { status: 400 });

    // Build rich data summary for AI
    const nodeSummary = (nodes as Array<{ id: string; name: string; type: string; data: Record<string, unknown> }>).map(n => {
      const d = n.data;
      switch (n.type) {
        case 'company':
          return `[公司] ${n.name}（分析了${d.jd_count || 0}个JD，招聘${(d.positions as string[] || []).length}个职位方向）`;
        case 'skill': {
          const companies = (d.companies as string[] || []).join('、');
          const sources = (d.sources as string[] || []).slice(0, 8).join('、');
          const covered = d.covered ? '已覆盖' : '⚠️未覆盖';
          const imp = d.importance_mode === 'high' ? '高' : d.importance_mode === 'low' ? '低' : '中';
          const cat = d.normalized_category || '';
          return `[技能] ${n.name}（出现${d.frequency || 0}次，重要性${imp}，${covered}，类别:${cat}，看重公司:${companies}${sources ? `，来源表述:${sources}` : ''}）`;
        }
        case 'position':
          return `[职位] ${n.name}（${d.position_jd_count || 0}个JD）`;
        case 'category':
          return `[来源技能] ${n.name}（频次${d.frequency || 0}，归一到:${(d.normalized_skills as string[] || []).join('/')}）`;
        case 'module':
          return `[模块] ${n.name}（层级${d.module_level || '?'}）`;
        default:
          return `[${n.type}] ${n.name}`;
      }
    }).join('\n');

    const edgeSummary = (edges as Array<{ source: string; target: string; relation: string; data: Record<string, unknown> }>).map(e => {
      const srcName = (nodes as Array<{ id: string; name: string }>).find(n => n.id === e.source)?.name || e.source;
      const tgtName = (nodes as Array<{ id: string; name: string }>).find(n => n.id === e.target)?.name || e.target;
      const extra = e.relation === '看重' ? `重要性=${e.data.importance || '中'},频次=${e.data.frequency || 1}` :
                     e.relation === '要求' ? `重要性=${e.data.importance || '中'}` :
                     e.relation === '已覆盖' ? `匹配度=${e.data.match_score || 0}` :
                     e.relation === '属于' ? `频次=${e.data.frequency || 1}` : '';
      return `${srcName} -[${e.relation}]-> ${tgtName} (${extra})`;
    }).join('\n');

    const prompt = `图谱数据：

=== 节点 ===
${nodeSummary}

=== 关系 ===
${edgeSummary}

=== 用户问题 ===
${query}

请基于以上图谱数据回答问题。记住：不要简单罗列，要生成有洞察的分析。`;

    const result = await generateText(prompt, {
      system: KG_QA_SYSTEM_PROMPT,
      maxTokens: 3072,
    });

    return NextResponse.json({ answer: result });
  } catch (error) {
    console.error('KG QA error:', error);
    return NextResponse.json({ error: 'AI 调用失败，请重试' }, { status: 500 });
  }
}
