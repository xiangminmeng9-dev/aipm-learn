import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeSkill } from '@/lib/ai/skill-normalizer';
import { getSkillCategory } from '@/lib/ai/skill-categories';

/**
 * POST /api/jd/renormalize-skills
 * 对现有 JD 数据中的技能名进行归一化重新映射
 * - jd_analyses.extracted_skills 中的 skill_name 归一化
 * - jd_skills 表中的 skill_name 归一化并合并同名词频
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 1. 归一化 jd_analyses.extracted_skills
    const { data: analyses, error: analysesError } = await supabase
      .from('jd_analyses')
      .select('id, extracted_skills')
      .eq('user_id', user.id);

    if (analysesError) {
      return NextResponse.json({ error: analysesError.message }, { status: 500 });
    }

    let analysisUpdated = 0;
    for (const jd of (analyses || [])) {
      const skills = jd.extracted_skills as Array<{ skill_name: string; category?: string; importance?: string; evidence?: string }>;
      if (!skills || skills.length === 0) continue;

      let changed = false;
      const newSkills = skills.map(s => {
        const normalized = normalizeSkill(s.skill_name);
        if (normalized !== s.skill_name) {
          changed = true;
          return {
            ...s,
            skill_name: normalized,
            category: getSkillCategory(normalized),
          };
        }
        return {
          ...s,
          category: s.category || getSkillCategory(s.skill_name),
        };
      });

      if (changed) {
        const { error } = await supabase
          .from('jd_analyses')
          .update({ extracted_skills: newSkills })
          .eq('id', jd.id);
        if (!error) analysisUpdated++;
      }
    }

    // 2. 归一化 jd_skills 表
    const { data: jdSkills, error: skillsError } = await supabase
      .from('jd_skills')
      .select('id, skill_name, category, frequency')
      .eq('user_id', user.id);

    if (skillsError) {
      return NextResponse.json({ error: skillsError.message }, { status: 500 });
    }

    // 按归一化后的名称合并频次
    const mergedSkills = new Map<string, { ids: string[]; totalFreq: number; category: string }>();
    for (const js of (jdSkills || [])) {
      const normalized = normalizeSkill(js.skill_name);
      const category = getSkillCategory(normalized);
      if (mergedSkills.has(normalized)) {
        const existing = mergedSkills.get(normalized)!;
        existing.ids.push(js.id);
        existing.totalFreq += js.frequency;
      } else {
        mergedSkills.set(normalized, {
          ids: [js.id],
          totalFreq: js.frequency,
          category,
        });
      }
    }

    let skillsMerged = 0;
    let skillsDeleted = 0;
    for (const [normalizedName, data] of mergedSkills.entries()) {
      if (data.ids.length > 1) {
        // 保留第一条，删除其余，更新频次
        const [keepId, ...deleteIds] = data.ids;
        await supabase
          .from('jd_skills')
          .update({
            skill_name: normalizedName,
            category: data.category,
            frequency: data.totalFreq,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', keepId);

        for (const delId of deleteIds) {
          await supabase.from('jd_skills').delete().eq('id', delId);
          skillsDeleted++;
        }
        skillsMerged++;
      } else {
        // 只有一条，更新名称和分类
        await supabase
          .from('jd_skills')
          .update({
            skill_name: normalizedName,
            category: data.category,
          })
          .eq('id', data.ids[0]);
      }
    }

    return NextResponse.json({
      success: true,
      analysis_updated: analysisUpdated,
      skills_merged: skillsMerged,
      skills_deleted: skillsDeleted,
      total_normalized_skills: mergedSkills.size,
      message: `归一化完成：${analysisUpdated}条JD分析更新，${skillsMerged}个技能合并，${skillsDeleted}个重复删除，最终${mergedSkills.size}个技能`,
    });
  } catch (err) {
    console.error('Renormalize error:', err);
    return NextResponse.json({ error: '归一化失败' }, { status: 500 });
  }
}
