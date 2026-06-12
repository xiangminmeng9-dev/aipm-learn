import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildCombinedJdAnalysisPrompt, COMBINED_JD_ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { computeResumeMatch, type AiResumeJudgment } from '@/lib/ai/jd-scoring';

/**
 * POST /api/jd/reanalyze
 * 批量重新分析已有的 JD 记录，使用新的 7 维度评分体系
 * Body: { ids?: string[] } — 不传则重新分析所有有简历的记录
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { ids } = await request.json().catch(() => ({})) as { ids?: string[] };

    // 查询需要重新分析的记录（有简历文本的）
    let query = supabase
      .from('jd_analyses')
      .select('id, jd_text, resume_text, position_name, extracted_skills')
      .eq('user_id', user.id)
      .not('resume_text', 'is', null);

    if (ids && ids.length > 0) {
      query = query.in('id', ids);
    }

    const { data: records, error: fetchError } = await query;
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ message: '没有需要重新分析的记录', updated: 0 });
    }

    // 获取模块列表（和 analyze 路由一样的默认模块）
    const { data: modulesData } = await supabase
      .from('skill_modules')
      .select('id, name, description')
      .limit(20);

    const moduleList = (modulesData || []).map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
    }));

    const defaultModules = moduleList.length > 0 ? moduleList : [
      { id: 'm1', name: 'AI 产品基础', description: 'AI 产品经理核心概念、AI 技术栈概览' },
      { id: 'm2', name: 'LLM 技术原理', description: '大语言模型原理、Prompt Engineering、RAG、Agent' },
      { id: 'm3', name: 'AI 产品设计', description: 'AI 产品设计方法、用户体验、交互设计' },
      { id: 'm4', name: '数据与评估', description: 'AI 产品数据指标、A/B 测试、效果评估' },
      { id: 'm5', name: 'AI 工程实践', description: 'MLOps、模型部署、性能优化' },
      { id: 'm6', name: '行业应用', description: 'AI 在各行业的应用案例和商业模式' },
    ];

    const results: { id: string; position: string; score: number; status: string }[] = [];
    const errors: { id: string; position: string; error: string }[] = [];

    // 逐条重新分析（串行，避免并发过高）
    for (const record of records) {
      try {
        const prompt = buildCombinedJdAnalysisPrompt(record.jd_text, defaultModules, record.resume_text);
        const aiResponse = await generateText(prompt, {
          system: COMBINED_JD_ANALYSIS_SYSTEM_PROMPT,
          maxTokens: 8192,
        });

        // 解析 AI 响应
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          errors.push({ id: record.id, position: record.position_name, error: 'AI 返回格式异常' });
          continue;
        }

        let jsonStr = jsonMatch[0];
        // 修复截断的JSON
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        if (openBrackets > closeBrackets || openBraces > closeBraces) {
          const jStart = jsonStr.lastIndexOf('"resume_judgment"');
          const mStart = jsonStr.lastIndexOf('"resume_match"');
          const rmStart = Math.max(jStart !== -1 ? jStart : -1, mStart !== -1 ? mStart : -1);
          if (rmStart !== -1 && rmStart > jsonStr.lastIndexOf('}')) {
            jsonStr = jsonStr.slice(0, rmStart).replace(/,\s*$/, '');
          } else {
            jsonStr = jsonStr.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
            jsonStr = jsonStr.replace(/,\s*$/g, '');
          }
          for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
        }

        const parsed = JSON.parse(jsonStr);

        // 只更新 resume_match 部分 — AI 返回 resume_judgment，本地计算评分
        let resumeMatch = null;
        if (parsed.resume_judgment) {
          try {
            const j = parsed.resume_judgment;
            const judgment: AiResumeJudgment = {
              covered_skills: Array.isArray(j.covered_skills) ? j.covered_skills.map(String) : [],
              quantified_skills: Array.isArray(j.quantified_skills) ? j.quantified_skills.map(String) : [],
              jd_responsibilities: Array.isArray(j.jd_responsibilities) ? j.jd_responsibilities.map(String) : [],
              covered_responsibilities: Array.isArray(j.covered_responsibilities) ? j.covered_responsibilities.map(String) : [],
              demonstrated_soft_skills: Array.isArray(j.demonstrated_soft_skills) ? j.demonstrated_soft_skills.map(String) : [],
              required_years: typeof j.required_years === 'number' ? j.required_years : null,
              candidate_years: typeof j.candidate_years === 'number' ? j.candidate_years : null,
              industry_match_level: ['exact', 'related', 'unrelated', 'unknown'].includes(j.industry_match_level) ? j.industry_match_level : 'unknown',
              strengths: Array.isArray(j.strengths) ? j.strengths.map(String) : [],
              resume_gaps: Array.isArray(j.resume_gaps) ? j.resume_gaps.map((g: unknown) => {
                if (typeof g === 'string') return { skill_name: g, detail: '', suggestion: '' };
                const obj = g as Record<string, unknown>;
                return {
                  skill_name: String(obj.skill_name || ''),
                  detail: String(obj.detail || ''),
                  suggestion: String(obj.suggestion || ''),
                };
              }) : [],
              improvement_suggestions: Array.isArray(j.improvement_suggestions) ? j.improvement_suggestions.map(String) : [],
            };
            // 使用已有的 extracted_skills 进行本地评分
            const existingSkills = Array.isArray(record.extracted_skills)
              ? record.extracted_skills.map((s: unknown) => {
                  if (typeof s === 'string') return { skill_name: s, category: '未分类', importance: 'medium' };
                  const obj = s as Record<string, unknown>;
                  return {
                    skill_name: String(obj.skill_name || obj.name || ''),
                    category: String(obj.category || '未分类'),
                    importance: String(obj.importance || 'medium'),
                  };
                })
              : [];
            resumeMatch = computeResumeMatch(judgment, existingSkills);
          } catch (scoringError) {
            console.error('Reanalyze scoring error:', scoringError);
            resumeMatch = null;
          }
        }

        // 更新数据库
        const { error: updateError } = await supabase
          .from('jd_analyses')
          .update({ resume_match: resumeMatch })
          .eq('id', record.id)
          .eq('user_id', user.id);

        if (updateError) {
          errors.push({ id: record.id, position: record.position_name, error: updateError.message });
        } else {
          results.push({
            id: record.id,
            position: record.position_name,
            score: resumeMatch?.match_score ?? 0,
            status: 'updated',
          });
        }
      } catch (err) {
        errors.push({
          id: record.id,
          position: record.position_name,
          error: err instanceof Error ? err.message : '分析失败',
        });
      }
    }

    return NextResponse.json({
      total: records.length,
      updated: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (err) {
    console.error('Batch reanalyze error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '批量重新分析失败' },
      { status: 500 },
    );
  }
}
