import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if today's challenge already exists in DB (cached)
    let { data: challenge } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // If cached, return immediately (fast)
    if (challenge) {
      const { data: { user } } = await supabase.auth.getUser();
      let submission = null;
      if (user) {
        const { data } = await supabase
          .from('daily_challenge_submissions')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', challenge.id)
          .maybeSingle();
        submission = data;
      }
      return NextResponse.json({ challenge, submission });
    }

    // No cache — return default immediately, then async generate + cache
    const categories = ['需求分析', '竞品分析', '算法沟通', '产品设计', '数据指标', '项目管理', '用户研究', '技术理解'];
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    const defaultChallenge = {
      date: today,
      question: '作为 AI PM，你负责的推荐系统上线后用户点击率下降了 8%，你会怎么排查和解决？',
      category,
      difficulty,
      hint: '从数据、模型、用户三个维度分析',
      perfect_answer: '1. 数据层面：检查数据管道是否正常\n2. 模型层面：对比模型指标变化\n3. 用户层面：分析用户行为变化\n4. 快速止损：必要时回滚版本',
      scoring_rubric: [
        { dimension: '问题拆解', weight: 0.3, description: '能否系统性地拆解问题' },
        { dimension: '数据思维', weight: 0.3, description: '是否用数据驱动分析' },
        { dimension: '执行方案', weight: 0.4, description: '解决方案是否可执行' },
      ],
    };

    // Insert default immediately so user sees content right away
    const { data: inserted } = await supabase
      .from('daily_challenges')
      .insert(defaultChallenge)
      .select()
      .single();

    challenge = inserted || defaultChallenge;

    // Async: try AI generation to upgrade the default
    generateAndUpgradeChallenge(today, category, difficulty).catch(() => {});

    const { data: { user } } = await supabase.auth.getUser();
    let submission = null;
    if (user && challenge?.id) {
      const { data } = await supabase
        .from('daily_challenge_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .maybeSingle();
      submission = data;
    }

    return NextResponse.json({ challenge, submission });
  } catch (err) {
    console.error('Get daily challenge error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

async function generateAndUpgradeChallenge(date: string, category: string, difficulty: string): Promise<void> {
  try {
    const { generateText } = await import('@/lib/ai/claude');
    const aiResult = await generateText(
      `生成一道AI PM挑战题。类别：${category}，难度：${difficulty}。真实工作场景题。
只输出JSON：{"question":"题目","hint":"提示","perfect_answer":"满分要点","scoring_rubric":[{"dimension":"维度","weight":0.3,"description":"标准"}]}`,
      { system: '你是AI PM面试出题专家。只输出JSON，不要markdown代码块。', maxTokens: 600 }
    );

    const cleaned = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.question) return;

    const supabase = await createClient();
    await supabase
      .from('daily_challenges')
      .update({
        question: parsed.question,
        hint: parsed.hint,
        perfect_answer: parsed.perfect_answer,
        scoring_rubric: parsed.scoring_rubric,
      })
      .eq('date', date);
  } catch { /* silent */ }
}