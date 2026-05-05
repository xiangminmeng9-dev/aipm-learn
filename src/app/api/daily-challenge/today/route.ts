import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if today's challenge already exists in DB (cached)
    let { data: challenge } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // Force refresh: delete old and regenerate
    if (forceRefresh && challenge) {
      await serviceClient.from('daily_challenges').delete().eq('date', today);
      challenge = null;
    }

    // If cached, return immediately
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

    // No cache — generate with AI synchronously
    const categories = ['需求分析', '竞品分析', '算法沟通', '产品设计', '数据指标', '项目管理', '用户研究', '技术理解'];
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

    let question = '作为 AI PM，你负责的推荐系统上线后用户点击率下降了 8%，你会怎么排查和解决？';
    let hint = '从数据、模型、用户三个维度分析';
    let perfectAnswer = '1. 数据层面：检查数据管道是否正常\n2. 模型层面：对比模型指标变化\n3. 用户层面：分析用户行为变化\n4. 快速止损：必要时回滚版本';
    let scoringRubric = [
      { dimension: '问题拆解', weight: 0.3, description: '能否系统性地拆解问题' },
      { dimension: '数据思维', weight: 0.3, description: '是否用数据驱动分析' },
      { dimension: '执行方案', weight: 0.4, description: '解决方案是否可执行' },
    ];

    // Try AI generation synchronously
    try {
      const { generateText } = await import('@/lib/ai/claude');
      // Fetch existing questions to avoid duplicates
      const { data: existingChallenges } = await serviceClient
        .from('daily_challenges')
        .select('question')
        .order('date', { ascending: false })
        .limit(30);
      const existingQuestions = (existingChallenges ?? []).map((c: { question: string }) => c.question).filter(Boolean);
      const avoidList = existingQuestions.length > 0
        ? `\n\n以下题目已出过，请勿重复或高度相似：\n${existingQuestions.map((q: string) => `- ${q}`).join('\n')}`
        : '';

      const aiResult = await generateText(
        `生成一道AI PM挑战题。类别：${category}，难度：${difficulty}。真实工作场景题，题目要具体有深度，不要和已有题目重复。只输出JSON：{"question":"题目","hint":"提示","perfect_answer":"满分要点","scoring_rubric":[{"dimension":"维度","weight":0.3,"description":"标准"}]}${avoidList}`,
        { system: '你是AI PM面试出题专家。只输出JSON，不要markdown代码块。每天出不同的题，避免重复。question和perfect_answer要简洁，各不超过100字。', maxTokens: 1024 }
      );
      let cleaned = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Try to parse, handle truncated JSON by closing open braces
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const fixed = cleaned + (cleaned.endsWith('"') ? '}' : cleaned.endsWith(',') ? '"":0}}' : '"}');
        try { parsed = JSON.parse(fixed); } catch { throw new Error('JSON parse failed even after fix: ' + cleaned.slice(0, 200)); }
      }
      if (parsed.question) {
        question = parsed.question;
        hint = parsed.hint || hint;
        perfectAnswer = parsed.perfect_answer || perfectAnswer;
        scoringRubric = parsed.scoring_rubric || scoringRubric;
      }
    } catch (err) {
      console.error('[daily-challenge/today] AI generation failed:', err);
    }

    const newChallenge = {
      date: today,
      question,
      category,
      difficulty,
      hint,
      perfect_answer: perfectAnswer,
      scoring_rubric: scoringRubric,
    };

    const { data: inserted } = await serviceClient
      .from('daily_challenges')
      .insert(newChallenge)
      .select()
      .single();

    challenge = inserted || newChallenge;

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
