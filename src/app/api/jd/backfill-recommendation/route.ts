import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Fetch all jd_analyses with resume_match but no apply_recommendation
    const { data: analyses, error } = await supabase
      .from('jd_analyses')
      .select('id, position_name, company_name, resume_match, resume_text, jd_text')
      .eq('user_id', user.id)
      .not('resume_match', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({ updated: 0, message: '没有需要补全的记录' });
    }

    // Filter records that are missing apply_recommendation
    const needsUpdate = analyses.filter((a: Record<string, unknown>) => {
      const rm = a.resume_match as Record<string, unknown> | null;
      if (!rm || typeof rm !== 'object') return false;
      return !rm.apply_recommendation;
    });

    if (needsUpdate.length === 0) {
      return NextResponse.json({ updated: 0, message: '所有记录已有投递建议' });
    }

    let updated = 0;
    let failed = 0;

    for (const analysis of needsUpdate) {
      const rm = analysis.resume_match as Record<string, unknown>;
      const matchScore = typeof rm.match_score === 'number' ? rm.match_score : 0;
      const strengths = Array.isArray(rm.strengths) ? rm.strengths : [];
      const resumeGaps = Array.isArray(rm.resume_gaps) ? rm.resume_gaps : [];
      const improvementSuggestions = Array.isArray(rm.improvement_suggestions) ? rm.improvement_suggestions : [];
      const resumeText = (analysis.resume_text as string) || '';
      const jdText = (analysis.jd_text as string) || '';
      const positionName = (analysis.position_name as string) || '未知岗位';
      const companyName = (analysis.company_name as string) || '';

      // Skip if no resume text — can't generate meaningful recommendation
      if (!resumeText && matchScore === 0) {
        failed++;
        continue;
      }

      const prompt = `基于以下岗位JD与简历匹配分析数据，生成投递建议。

岗位：${positionName}
公司：${companyName || '未知'}
匹配分数：${matchScore}/100
匹配优势：${strengths.map(String).join('、')}
简历差距：${resumeGaps.map((g: unknown) => typeof g === 'string' ? g : (g as Record<string, unknown>).skill_name).join('、')}
改进建议：${improvementSuggestions.map(String).join('、')}

${resumeText ? `简历内容摘要：${resumeText.slice(0, 1000)}` : ''}
${jdText ? `JD内容摘要：${jdText.slice(0, 1000)}` : ''}

严格输出JSON，不要输出其他内容：
{
  "should_apply": true或false,
  "confidence": "high"或"medium"或"low",
  "reason": "1-2句话说明核心原因",
  "key_actions": ["行动1", "行动2", "行动3"]
}

评分标准：
- should_apply=true: match_score>=50 或岗位核心要求与简历有较多重合
- should_apply=false: match_score<40 或岗位核心要求与简历严重不匹配
- confidence=high: 判断依据充分
- confidence=medium/low: 存在不确定因素`;

      try {
        const aiResponse = await generateText(prompt, { maxTokens: 512 });
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          failed++;
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const applyRecommendation = {
          should_apply: !!parsed.should_apply,
          confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
          reason: String(parsed.reason || ''),
          key_actions: Array.isArray(parsed.key_actions) ? parsed.key_actions.map(String) : [],
        };

        // Merge into existing resume_match
        const updatedResumeMatch = { ...(rm as Record<string, unknown>), apply_recommendation: applyRecommendation };

        const { error: updateError } = await supabase
          .from('jd_analyses')
          .update({ resume_match: updatedResumeMatch })
          .eq('id', analysis.id)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Update error for', analysis.id, updateError);
          failed++;
        } else {
          updated++;
        }
      } catch (err) {
        console.error('AI call failed for', analysis.id, err);
        failed++;
      }
    }

    return NextResponse.json({
      total: needsUpdate.length,
      updated,
      failed,
    });
  } catch (err) {
    console.error('Backfill apply_recommendation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '补全失败' },
      { status: 500 }
    );
  }
}