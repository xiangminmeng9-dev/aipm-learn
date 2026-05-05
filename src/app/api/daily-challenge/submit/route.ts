import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { streamChatResponse } from '@/lib/ai/claude';

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

    const serviceClient = createServiceClient();

    // Get challenge details for evaluation context
    const { data: challenge } = await serviceClient
      .from('daily_challenges')
      .select('question, perfect_answer, scoring_rubric, category, difficulty')
      .eq('id', challenge_id)
      .single();

    const question = challenge?.question ?? '';
    const perfectAnswer = challenge?.perfect_answer ?? '';
    const rubric = (challenge?.scoring_rubric || []) as { dimension: string; weight: number; description: string }[];
    const rubricText = rubric.map((r) => `- ${r.dimension}（权重${r.weight}）：${r.description}`).join('\n');

    const evalPrompt = `评分面试回答。题目：${question}。满分回答：${perfectAnswer}。评分维度：${rubricText || '专业深度0.3、产品思维0.3、逻辑表达0.2、实战经验0.2'}。候选人回答：${answer.trim()}。
只输出JSON：{"scores":[{"dimension":"维度","score":0-100,"comment":"评语"}],"total_score":0-100,"overall_comment":"总评","improvement":"改进建议"}`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        try {
          for await (const chunk of streamChatResponse(
            [{ role: 'user', content: evalPrompt }],
            { model: 'sonnet', system: '你是AI PM面试评分官。评分严格公正。只输出JSON，不要markdown代码块。', maxTokens: 1000 },
          )) {
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }

          let evaluation;
          try {
            const cleaned = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            evaluation = JSON.parse(cleaned);
          } catch {
            evaluation = {
              scores: [{ dimension: '综合', score: 60, comment: 'AI 评分解析失败，已给出基础评分' }],
              total_score: 60,
              overall_comment: '回答已提交，AI 评分解析失败',
              improvement: '请稍后重试获取详细评分',
            };
          }

          // Save submission
          try {
            await serviceClient
              .from('daily_challenge_submissions')
              .upsert({
                user_id: user.id,
                challenge_id,
                answer: answer.trim(),
                score: evaluation.total_score || 0,
                feedback: JSON.stringify(evaluation),
                time_spent: time_spent || 0,
              }, { onConflict: 'user_id,challenge_id' });
          } catch {
            try {
              await serviceClient
                .from('daily_challenge_submissions')
                .insert({
                  user_id: user.id,
                  challenge_id,
                  answer: answer.trim(),
                  score: evaluation.total_score || 0,
                  feedback: JSON.stringify(evaluation),
                  time_spent: time_spent || 0,
                });
            } catch {}
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, evaluation })}\n\n`));
        } catch (err) {
          console.error('Daily challenge stream error:', err);
          // Fallback evaluation
          const fallback = {
            scores: [{ dimension: '综合', score: 60, comment: 'AI 评分暂时不可用' }],
            total_score: 60,
            overall_comment: '回答已提交，AI 评分暂时不可用',
            improvement: '请稍后重试获取详细评分',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, evaluation: fallback })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Submit daily challenge error:', err);
    return NextResponse.json({ error: '评分失败，请重试' }, { status: 500 });
  }
}