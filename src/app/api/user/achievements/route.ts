import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ achievements: [], all: [] });

    const serviceClient = createServiceClient();

    const [{ data: allTypes }, { data: unlocked }] = await Promise.all([
      serviceClient.from('achievement_types').select('*').order('tier').order('key'),
      serviceClient.from('user_achievements').select('achievement_key, unlocked_at').eq('user_id', user.id),
    ]);

    const unlockedKeys = new Set((unlocked ?? []).map(u => u.achievement_key));
    const unlockedMap: Record<string, string> = {};
    (unlocked ?? []).forEach(u => { unlockedMap[u.achievement_key] = u.unlocked_at; });

    const achievements = (allTypes ?? []).map(a => ({
      ...a,
      unlocked: unlockedKeys.has(a.key),
      unlocked_at: unlockedMap[a.key] || null,
    }));

    return NextResponse.json({
      achievements: achievements.filter(a => a.unlocked),
      all: achievements,
      total: allTypes?.length ?? 0,
      unlocked_count: unlockedKeys.size,
    });
  } catch (err) {
    console.error('Achievements GET error:', err);
    return NextResponse.json({ achievements: [], all: [], total: 0, unlocked_count: 0 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();

    // Check all achievement conditions
    const newAchievements: string[] = [];

    // QA count
    const { count: qaCount } = await serviceClient.from('question_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    const qaChecks: [string, number][] = [['first_qa', 1], ['qa_10', 10], ['qa_50', 50]];
    for (const [key, threshold] of qaChecks) {
      if (qaCount && qaCount >= threshold) {
        const { error } = await serviceClient.from('user_achievements').upsert({ user_id: user.id, achievement_key: key }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true });
        if (!error) newAchievements.push(key);
      }
    }

    // Mock count
    const { count: mockCount } = await serviceClient.from('mock_interviews').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    const mockChecks: [string, number][] = [['first_mock', 1], ['mock_5', 5]];
    for (const [key, threshold] of mockChecks) {
      if (mockCount && mockCount >= threshold) {
        const { error } = await serviceClient.from('user_achievements').upsert({ user_id: user.id, achievement_key: key }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true });
        if (!error) newAchievements.push(key);
      }
    }

    // Skill coverage
    const { count: totalTasks } = await serviceClient.from('learning_tasks').select('id', { count: 'exact', head: true });
    const { data: completed } = await serviceClient.from('learning_progress').select('task_id').eq('user_id', user.id).eq('status', 'completed');
    if (totalTasks && totalTasks > 0) {
      const pct = Math.round(((completed?.length ?? 0) / totalTasks) * 100);
      const skillChecks: [string, number][] = [['skill_25', 25], ['skill_50', 50], ['skill_75', 75]];
      for (const [key, threshold] of skillChecks) {
        if (pct >= threshold) {
          const { error } = await serviceClient.from('user_achievements').upsert({ user_id: user.id, achievement_key: key }, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true });
          if (!error) newAchievements.push(key);
        }
      }
    }

    return NextResponse.json({ new_achievements: newAchievements });
  } catch (err) {
    console.error('Achievements check error:', err);
    return NextResponse.json({ error: '检查失败' }, { status: 500 });
  }
}
