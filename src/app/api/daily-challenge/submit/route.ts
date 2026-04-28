import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { challenge_id, answer, time_spent } = await request.json();
    if (!challenge_id) {
      return NextResponse.json({ error: '缺少题目ID，请刷新页面重试' }, { status: 400 });
    }
    if (!answer?.trim()) {
      return NextResponse.json({ error: '请提供回答内容' }, { status: 400 });
    }

    // Get challenge details for evaluation context
    const { data: challenge } = await supabase
      .from('daily_challenges')
      .select('question, perfect_answer, scoring_rubric, category, difficulty')
      .eq('id', challenge_id)
      .single();

    const question = challenge?.question ?? '';
    const perfectAnswer = challenge?.perfect_answer ?? '';
    const rubric = (challenge?.scoring_rubric || []) as { dimension: string; weight: number; description: string }[];
    const rubricText = rubric.map((r) => `- ${r.dimension}（权重${r.weight}）：${r.description}`).join('\n');

    // AI evaluation
    let evaluation;
    try {
      const { generateText } = await import('@/lib/ai/claude');
      const evalResult = await generateText(
        `评分面试回答。题目：${question}。满分回答：${perfectAnswer}。评分维度：${rubricText || '专业深度0.3、产品思维0.3、逻辑表达0.2、实战经验0.2'}。候选人回答：${answer.trim()}。
只输出JSON：{"scores":[{"dimension":"维度","score":0-100,"comment":"评语"}],"total_score":0-100,"overall_comment":"总评","improvement":"改进建议"}`,
        { system: '你是AI PM面试评分官。评分严格公正。只输出JSON，不要markdown代码块。', maxTokens: 1000 }
      );

      const cleaned = evalResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleaned);
    } catch (aiErr) {
      console.error('AI evaluation error:', aiErr);
      // Fallback evaluation
      evaluation = {
        scores: [{ dimension: '综合', score: 60, comment: 'AI 评分暂时不可用，已给出基础评分' }],
        total_score: 60,
        overall_comment: '回答已提交，AI 评分暂时不可用',
        improvement: '请稍后重试获取详细评分',
      };
    }

    // Save submission to database
    try {
      const { error } = await supabase
        .from('daily_challenge_submissions')
        .upsert({
          user_id: user.id,
          challenge_id,
          answer: answer.trim(),
          score: evaluation.total_score || 0,
          feedback: JSON.stringify(evaluation),
          time_spent: time_spent || 0,
        }, { onConflict: 'user_id,challenge_id' });

      if (error) {
        console.error('Upsert submission error:', error);
        // Try regular insert if upsert fails (e.g., no unique constraint)
        await supabase
          .from('daily_challenge_submissions')
          .insert({
            user_id: user.id,
            challenge_id,
            answer: answer.trim(),
            score: evaluation.total_score || 0,
            feedback: JSON.stringify(evaluation),
            time_spent: time_spent || 0,
          });
      }
    } catch (dbErr) {
      console.error('Save submission DB error:', dbErr);
      // Still return evaluation even if DB save fails
    }

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error('Submit daily challenge error:', err);
    return NextResponse.json({ error: '评分失败，请重试' }, { status: 500 });
  }
}