import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { streamChatResponse } from '@/lib/ai/claude';
import { buildCompetitiveAnalysisPrompt, COMPETITIVE_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const { productName } = body;
    if (!productName || productName.trim().length < 2) {
      return NextResponse.json({ error: '请输入有效的产品名称（至少2个字符）' }, { status: 400 });
    }

    const prompt = buildCompetitiveAnalysisPrompt(productName.trim());
    const stream = streamChatResponse(
      [{ role: 'user', content: prompt }],
      { model: 'sonnet', system: COMPETITIVE_ANALYSIS_SYSTEM_PROMPT, maxTokens: 4096 }
    );

    const encoder = new TextEncoder();
    let fullText = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }

          // Parse and save after streaming completes
          const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/) || fullText.match(/\{[\s\S]*"dimensionScores"[\s\S]*\}/);
          let scoring: { dimensionScores: { dimension: string; score: number; comment: string }[]; totalScore: number } | null = null;
          if (jsonMatch) {
            try {
              const raw = jsonMatch[1] || jsonMatch[0];
              scoring = JSON.parse(raw.trim());
            } catch {
              const objMatch = fullText.match(/\{[^{}]*"dimensionScores"[\s\S]*\}/);
              if (objMatch) {
                try { scoring = JSON.parse(objMatch[0]); } catch {}
              }
            }
          }

          const markdownContent = jsonMatch?.index ? fullText.slice(0, jsonMatch.index).trim() : fullText.replace(/\{[\s\S]*"dimensionScores"[\s\S]*\}/, '').trim();

          const marketPosition = markdownContent.match(/##\s*[🏢📊📈🎯].*?市场定位[\s\S]*?(?=##\s*[⚡💪🆚🔧].*?(?:功能对比|核心功能|优劣势|差异化)|$)/i)?.[0]?.trim()
            || markdownContent.match(/##\s*.*?市场定位[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
          const featureComparison = markdownContent.match(/##\s*[⚡🆚🔧📊].*?(?:功能对比|核心功能|功能分析)[\s\S]*?(?=##\s*[💪🏢🎯].*?(?:优劣势|市场定位|差异化)|$)/i)?.[0]?.trim()
            || markdownContent.match(/##\s*.*?(?:功能对比|核心功能)[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
          const strengthsWeaknesses = markdownContent.match(/##\s*[💪⚖️].*?(?:优劣势|优势劣势|SWOT)[\s\S]*?(?=##\s*[🏢⚡🎯].*?(?:市场定位|功能对比|差异化)|$)/i)?.[0]?.trim()
            || markdownContent.match(/##\s*.*?(?:优劣势|优势劣势|SWOT)[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
          const differentiationStrategy = markdownContent.match(/##\s*[🎯🚀💡].*?(?:差异化|策略|竞争策略)[\s\S]*?(?=##\s*[🏢⚡💪].*?(?:市场定位|功能对比|优劣势)|$)/i)?.[0]?.trim()
            || markdownContent.match(/##\s*.*?(?:差异化|策略建议|竞争策略)[\s\S]*?(?=##|$)/i)?.[0]?.trim() || '';
          const fallbackContent = (!marketPosition && !featureComparison && !strengthsWeaknesses && !differentiationStrategy) ? markdownContent : '';

          const dimensionScores = scoring?.dimensionScores || [];
          const totalScore = scoring?.totalScore ?? 0;

          // Save to database
          const serviceClient = createServiceClient();
          const { data, error } = await serviceClient
            .from('competitive_analyses')
            .insert({
              user_id: user.id,
              product_name: productName.trim(),
              market_position: marketPosition || fallbackContent,
              feature_comparison: featureComparison,
              strengths_weaknesses: strengthsWeaknesses,
              differentiation_strategy: differentiationStrategy,
              total_score: totalScore,
              dimension_scores: dimensionScores,
            })
            .select()
            .single();

          if (error) {
            console.error('Competitive analysis save error:', JSON.stringify(error));
          }

          // Send final event with scoring and record id
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            done: true,
            scoring: { totalScore, dimensionScores },
            recordId: data?.id || null,
          })}\n\n`));
        } catch (err) {
          console.error('Competitive analysis stream error:', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成失败' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Competitive analysis error:', error);
    return NextResponse.json({ error: '生成分析失败，请稍后重试' }, { status: 500 });
  }
}