import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// POST /api/skills/learning-path/stage-test — generate stage auto-test
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { stage_name, modules } = await request.json() as {
      stage_name: string;
      modules: { name: string; description: string; key_tasks: string[] }[];
    };

    if (!stage_name || !modules?.length) {
      return NextResponse.json({ error: '缺少阶段信息' }, { status: 400 });
    }

    const moduleInfo = modules.map((m) => `- ${m.name}：${m.description}（核心任务：${m.key_tasks.join('、')}）`).join('\n');

    const { generateText } = await import('@/lib/ai/claude');
    const aiResult = await generateText(
      `用户刚完成学习路径的"${stage_name}"阶段，该阶段包含以下模块：
${moduleInfo}

请生成3道自测题检验学习效果。题目应覆盖该阶段核心知识点，难度适中。
只输出JSON：{"questions":[{"question":"题目","key_points":["要点1","要点2"],"sample_answer":"参考答案要点"}]}`,
      { system: '你是AI PM学习评估专家。出题紧扣实际工作场景，检验知识掌握程度。只输出JSON，不要markdown代码块。', maxTokens: 1500 }
    );

    let questions;
    try {
      const cleaned = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      questions = JSON.parse(cleaned);
    } catch {
      questions = {
        questions: [
          { question: `请简述${modules[0]?.name ?? '该阶段'}的核心概念和应用场景`, key_points: ['概念定义', '应用场景', '注意事项'], sample_answer: '请结合实际工作场景回答' },
          { question: `在${stage_name}阶段中，最重要的3个知识点是什么？`, key_points: ['知识1', '知识2', '知识3'], sample_answer: '请列举并简要说明' },
          { question: `如何将${modules[0]?.name ?? '该模块'}的知识应用到实际产品工作中？`, key_points: ['实践方法', '常见误区', '效果评估'], sample_answer: '请结合案例说明' },
        ],
      };
    }

    return NextResponse.json(questions);
  } catch (err) {
    console.error('Stage test error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}

// POST with action=evaluate — evaluate stage test answers
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { stage_name, answers } = await request.json() as {
      stage_name: string;
      answers: { question: string; answer: string; key_points: string[] }[];
    };

    if (!answers?.length) return NextResponse.json({ error: '请提供回答' }, { status: 400 });

    const { generateText } = await import('@/lib/ai/claude');
    const evalResult = await generateText(
      `评估"${stage_name}"阶段自测回答。每题0-100分。
${answers.map((a, i) => `题目${i + 1}：${a.question}\n关键要点：${a.key_points.join('、')}\n用户回答：${a.answer}`).join('\n\n')}
只输出JSON：{"scores":[{"score":0-100,"comment":"评语"}],"total_score":0-100,"overall_comment":"总评","passed":true/false}`,
      { system: '你是AI PM学习评估专家。评分严格公正，关键要点覆盖度是主要评分依据。只输出JSON。', maxTokens: 800 }
    );

    let evaluation;
    try {
      const cleaned = evalResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch {
      evaluation = { scores: answers.map(() => ({ score: 60, comment: '评分暂时不可用' })), total_score: 60, overall_comment: '回答已提交', passed: true };
    }

    return NextResponse.json(evaluation);
  } catch (err) {
    console.error('Stage test evaluate error:', err);
    return NextResponse.json({ error: '评分失败' }, { status: 500 });
  }
}
