import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { challenge_id, answer, time_spent } = await request.json();
    if (!challenge_id || !answer) return NextResponse.json({ error: '参数缺失' }, { status: 400 });

    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('question, perfect_answer, scoring_rubric, category, difficulty')
      .eq('id', challenge_id)
      .single();

    if (!challenge) return NextResponse.json({ error: '题目不存在' }, { status: 404 });

    const { generateText } = await import('@/lib/ai/claude');
    const rubricText = (challenge.scoring_rubric || []).map((r: { dimension: string; weight: number; description: string }) =>
      `- ${r.dimension}（权重${r.weight}）：${r.description}`
    ).join('\n');

    const evalResult = await generateText(
      `评分面试回答。题目：${challenge.question}。满分回答：${challenge.perfect_answer}。评分维度：${rubricText || '专业深度0.3、产品思维0.3、逻辑表达0.2、实战经验0.2'}。候选人回答：${answer}。
只输出JSON：{"scores":[{"dimension":"维度","score":0-100,"comment":"评语"}],"total_score":0-100,"overall_comment":"总评","improvement":"改进建议"}`,
      { system: '你是AI PM面试评分官。评分严格公正。只输出JSON，不要markdown代码块。', maxTokens: 1000 }
    );

    let evaluation;
    try {
      const cleaned = evalResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch {
      evaluation = {
        scores: [{ dimension: '综合', score: 70, comment: '回答基本合理' }],
        total_score: 70,
        overall_comment: '回答基本合理，建议更结构化',
        improvement: '尝试用"结论-分析-方案"的结构组织回答',
      };
    }

    const { error } = await supabase
      .from('daily_challenge_submissions')
      .upsert({
        user_id: user.id,
        challenge_id,
        answer,
        score: evaluation.total_score || 0,
        feedback: JSON.stringify(evaluation),
        time_spent: time_spent || 0,
      }, { onConflict: 'user_id,challenge_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error('Submit daily challenge error:', err);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}
