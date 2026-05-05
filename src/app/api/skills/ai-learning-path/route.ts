import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';
import { buildLearningPathPrompt, LEARNING_PATH_SYSTEM_PROMPT } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();

    // Collect weakness data from multiple sources
    const weaknessParts: string[] = [];

    try {
      const { data: sysModules } = await serviceClient.from('skill_modules').select('id, name, level');
      const { data: sysTasks } = await serviceClient.from('learning_tasks').select('id, module_id');
      const { data: sysProgress } = await serviceClient.from('learning_progress').select('task_id, status').eq('user_id', user.id);

      const completedTaskIds = new Set((sysProgress ?? []).filter(p => p.status === 'completed').map(p => p.task_id));
      const taskCountByModule: Record<string, { name: string; total: number; completed: number }> = {};
      for (const t of sysTasks ?? []) {
        if (!taskCountByModule[t.module_id]) {
          const mod = sysModules?.find(m => m.id === t.module_id);
          taskCountByModule[t.module_id] = { name: mod?.name || '未知', total: 0, completed: 0 };
        }
        taskCountByModule[t.module_id].total++;
        if (completedTaskIds.has(t.id)) taskCountByModule[t.module_id].completed++;
      }

      const weakModules = Object.values(taskCountByModule)
        .filter(m => m.total > 0 && m.completed / m.total < 0.5)
        .sort((a, b) => (a.completed / a.total) - (b.completed / b.total));

      if (weakModules.length > 0) {
        weaknessParts.push('【技能树弱项模块】\n' + weakModules.map(m =>
          `- ${m.name}: 完成率 ${Math.round(m.completed / m.total * 100)}% (${m.completed}/${m.total})`
        ).join('\n'));
      }
    } catch (e) { console.error('Weakness data collection error (skills):', e); }

    try {
      const { data: mockInterviews } = await serviceClient
        .from('mock_interviews')
        .select('id, type_id, total_score, weak_skill_modules')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (mockInterviews && mockInterviews.length > 0) {
        const weakAreas: string[] = [];
        for (const mi of mockInterviews) {
          if (mi.weak_skill_modules && Array.isArray(mi.weak_skill_modules)) {
            for (const wsm of mi.weak_skill_modules) {
              weakAreas.push(`${wsm.module_name}: ${wsm.recommended_tasks?.map((t: { task_name: string }) => t.task_name).join('、') || '无具体任务'}`);
            }
          }
          if (mi.total_score !== null && mi.total_score < 70) {
            weakAreas.push(`模拟面试总分偏低: ${mi.total_score}/100`);
          }
        }
        if (weakAreas.length > 0) {
          weaknessParts.push('【面试弱项】\n' + [...new Set(weakAreas)].map(a => `- ${a}`).join('\n'));
        }
      }
    } catch (e) { console.error('Weakness data collection error (interviews):', e); }

    try {
      const { data: qaRecords } = await serviceClient
        .from('assistant_qa_records')
        .select('evaluation, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const lowScoreCategories: Record<string, { count: number; avgScore: number }> = {};
      for (const r of qaRecords ?? []) {
        const ev = r.evaluation as Record<string, unknown> | null;
        if (ev) {
          const s = ev.total_score ?? ev.score ?? ev.overall_score;
          if (typeof s === 'number' && s < 60) {
            const cat = r.category || '未分类';
            if (!lowScoreCategories[cat]) lowScoreCategories[cat] = { count: 0, avgScore: 0 };
            lowScoreCategories[cat].count++;
            lowScoreCategories[cat].avgScore += s;
          }
        }
      }

      const weakCats = Object.entries(lowScoreCategories).map(([cat, v]) => ({
        category: cat,
        count: v.count,
        avgScore: Math.round(v.avgScore / v.count),
      }));

      if (weakCats.length > 0) {
        weaknessParts.push('【面试问答低分类别】\n' + weakCats.map(c =>
          `- ${c.category}: 平均分 ${c.avgScore} (${c.count}次低分)`
        ).join('\n'));
      }
    } catch (e) { console.error('Weakness data collection error (qa):', e); }

    const weaknessData = weaknessParts.length > 0
      ? weaknessParts.join('\n\n')
      : '暂无具体弱项数据。请基于 AI PM 通用能力模型（需求分析、竞品分析、数据驱动、技术理解、沟通协作、产品思维）生成推荐学习路径。';

    const prompt = buildLearningPathPrompt(weaknessData);

    // Use generateText for reliable error reporting
    let result: string;
    try {
      result = await generateText(prompt, {
        model: 'sonnet',
        system: LEARNING_PATH_SYSTEM_PROMPT,
        maxTokens: 4096,
      });
    } catch (aiErr) {
      console.error('AI learning path AI call error:', aiErr);
      return NextResponse.json({ error: `AI 调用失败: ${aiErr instanceof Error ? aiErr.message : '未知错误'}` }, { status: 500 });
    }

    if (!result.trim()) {
      return NextResponse.json({ error: 'AI 返回为空，请重试' }, { status: 500 });
    }

    // Parse JSON result
    const jsonMatch = result.match(/```json\s*([\s\S]*?)```/) || result.match(/\{[\s\S]*"recommendedModules"[\s\S]*\}/);
    let parsed: { weaknessSummary: string; recommendedModules: { name: string; priority: string; estimatedHours: number; reason: string }[]; totalEstimatedHours: number } | null = null;
    if (jsonMatch) {
      try {
        const raw = jsonMatch[1] || jsonMatch[0];
        parsed = JSON.parse(raw.trim());
      } catch {
        const objMatch = result.match(/\{[^{}]*"recommendedModules"[\s\S]*\}/);
        if (objMatch) {
          try { parsed = JSON.parse(objMatch[0]); } catch {}
        }
      }
    }

    if (!parsed) {
      console.error('AI learning path: failed to parse. Raw output:', result.slice(0, 500));
      return NextResponse.json({ error: 'AI 输出格式解析失败，请重试' }, { status: 500 });
    }

    const weaknessSummary = parsed.weaknessSummary || '';
    const recommendedModules = (parsed.recommendedModules || []).map((m) => ({
      name: m.name,
      priority: m.priority === 'high' || m.priority === 'medium' ? m.priority : 'low',
      estimatedHours: m.estimatedHours || 0,
      reason: m.reason || '',
    }));
    const totalEstimatedHours = parsed.totalEstimatedHours || 0;

    // Save to database
    let savedId: string | null = null;
    let savedCreatedAt: string | null = null;
    try {
      const { data, error } = await serviceClient
        .from('ai_learning_paths')
        .insert({
          user_id: user.id,
          weakness_summary: weaknessSummary,
          recommended_modules: recommendedModules,
          total_estimated_hours: totalEstimatedHours,
        })
        .select()
        .single();

      if (error) {
        console.error('AI learning path save error:', JSON.stringify(error));
      } else {
        savedId = data.id;
        savedCreatedAt = data.created_at;
      }
    } catch (saveErr) {
      console.error('AI learning path save exception:', saveErr);
    }

    return NextResponse.json({
      path: {
        id: savedId || null,
        weaknessSummary,
        recommendedModules,
        totalEstimatedHours,
        createdAt: savedCreatedAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI learning path error:', error);
    return NextResponse.json({ error: `生成学习路径失败: ${error instanceof Error ? error.message : '未知错误'}` }, { status: 500 });
  }
}