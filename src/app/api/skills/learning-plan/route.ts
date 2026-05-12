import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from '@/lib/ai/claude';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data } = await supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({ plan: data || null });
  } catch (err) {
    console.error('Learning plan GET error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { target_role, target_date, weekly_hours } = await request.json();

    // Get user's skill stats
    const { count: totalTasks } = await supabase.from('learning_tasks').select('id', { count: 'exact', head: true });
    const { data: progress } = await supabase.from('learning_progress').select('task_id').eq('user_id', user.id).eq('status', 'completed');
    const completedCount = progress?.length ?? 0;

    const daysUntilTarget = target_date
      ? Math.max(1, Math.ceil((new Date(target_date).getTime() - Date.now()) / 86400000))
      : 30;
    const totalWeeks = Math.min(Math.ceil(daysUntilTarget / 7), 8);

    // Get skill modules for context
    const { data: modules } = await supabase.from('skill_modules').select('id, name, level, level_name').order('level').order('name');
    const moduleNames = (modules ?? []).slice(0, 8).map(m => m.name).join('、');

    const prompt = `你是AI PM学习教练，为"${target_role || 'AI产品经理'}"制定${totalWeeks}周学习计划(markdown格式不必JSON)。

## 第1周：主题XXX
- 第1天：任务名 — 做什么（30分钟）
- 第2天：任务名 — 做什么（30分钟）
...

## 第2周：主题XXX
...

## 总结
计划总结2-3句话。可选模块：${moduleNames}。当前完成${completedCount}/${totalTasks}个任务。每周${weekly_hours || 10}小时。`;

    const result = await generateText(prompt, {
      model: 'haiku',
      maxTokens: 1500,
      system: '你是学习规划专家。用markdown格式输出周计划。## 第N周作为标题，- 列表表示任务。不要用代码块。',
    });

    // Parse markdown into structured weeks
    const sections = result.split(/## 第(\d+)周/);
    const weeks: { week: number; theme: string; tasks: { day: number; title: string; description: string; module: string; estimated_minutes: number }[] }[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      const weekNum = parseInt(sections[i]);
      const content = sections[i + 1] || '';
      const lines = content.split('\n').filter(l => l.trim());
      const theme = lines[0]?.replace(/^[：:]*\s*/, '').replace(/^主题[:：]?\s*/, '').trim() || `第${weekNum}周`;

      const tasks = lines.filter(l => l.match(/^[-*•]\s/) || l.match(/^\d+[\.、]/)).slice(0, 7).map((l, idx) => {
        const text = l.replace(/^[-*•\d+\.\、]\s*/, '').trim();
        const parts = text.split(/[—–-]\s*/);
        return {
          day: idx + 1,
          title: parts[0]?.trim() || text,
          description: parts[1]?.trim() || '',
          module: moduleNames.split('、')[Math.floor(Math.random() * Math.min(moduleNames.split('、').length, 1))] || '综合',
          estimated_minutes: 30,
        };
      });

      if (tasks.length > 0) weeks.push({ week: weekNum, theme, tasks });
    }

    const summaryMatch = result.match(/##\s*总结[\s\S]*$/i);
    const summary = summaryMatch?.[0]?.replace(/##\s*总结\s*/i, '').trim() || `为期${totalWeeks}周的学习计划`;

    const planData = { weeks: weeks.slice(0, totalWeeks), summary };

    const { data: existing } = await supabase
      .from('learning_plans').select('id').eq('user_id', user.id).maybeSingle();

    if (existing) {
      await supabase.from('learning_plans').update({
        target_role: target_role || 'AI产品经理',
        target_date: target_date || null,
        weekly_hours: weekly_hours || 10,
        plan_data: planData,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('learning_plans').insert({
        user_id: user.id,
        target_role: target_role || 'AI产品经理',
        target_date: target_date || null,
        weekly_hours: weekly_hours || 10,
        plan_data: planData,
      });
    }

    return NextResponse.json({ plan: planData, success: true });
  } catch (err) {
    console.error('Learning plan POST error:', err);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
