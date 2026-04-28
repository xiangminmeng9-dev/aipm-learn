import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// GET /api/skills/learning-path/daily-plan — get today's learning tasks
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const serviceClient = createServiceClient();

    // Get user's latest learning path
    const { data: paths } = await serviceClient
      .from('learning_paths')
      .select('id, path_data, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!paths?.length) return NextResponse.json({ dailyTasks: [], message: '请先创建学习路径' });

    const path = paths[0];
    const pathData = path.path_data as { stages: { stage_name: string; duration_weeks: number; modules: { name: string; key_tasks: string[]; priority: string; description: string }[] }[] };

    // Calculate which stage the user should be in based on creation date
    const createdDate = new Date(path.created_at);
    const daysSinceStart = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = daysSinceStart / 7;

    let currentStageIndex = 0;
    let accumulatedWeeks = 0;
    for (let i = 0; i < pathData.stages.length; i++) {
      accumulatedWeeks += pathData.stages[i].duration_weeks;
      if (weeksSinceStart < accumulatedWeeks) {
        currentStageIndex = i;
        break;
      }
      currentStageIndex = i;
    }

    const currentStage = pathData.stages[currentStageIndex];

    // Get progress for user's tasks
    const { data: progress } = await supabase
      .from('learning_progress')
      .select('task_id, status')
      .eq('user_id', user.id);

    const completedTaskIds = new Set((progress ?? []).filter(p => p.status === 'completed').map(p => p.task_id));

    // Build daily tasks: pick 3 high-priority uncompleted tasks from current stage
    const allTasks = currentStage.modules
      .flatMap((m) => m.key_tasks.map((t) => ({
        module: m.name,
        task: t,
        priority: m.priority,
        description: m.description,
      })))
      .sort((a, b) => (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) - (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2));

    // Pick top 3 tasks for today
    const dailyTasks = allTasks.slice(0, 3);

    return NextResponse.json({
      dailyTasks,
      currentStage: currentStage.stage_name,
      currentStageIndex,
      totalStages: pathData.stages.length,
      daysSinceStart,
      stageProgress: `${weeksSinceStart.toFixed(1)}/${currentStage.duration_weeks} 周`,
      pathTitle: (pathData as { path_title?: string }).path_title ?? '学习路径',
    });
  } catch (err) {
    console.error('Daily plan error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}