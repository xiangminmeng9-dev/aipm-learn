import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PROJECT_SCENARIOS } from '@/lib/project-scenarios';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { scenario_id } = await request.json();
    const scenario = PROJECT_SCENARIOS.find(s => s.id === scenario_id);
    if (!scenario) return NextResponse.json({ error: '场景不存在' }, { status: 400 });

    const { data, error } = await supabase
      .from('simulator_projects')
      .insert({
        user_id: user.id,
        scenario_id: scenario.id,
        title: scenario.title,
        deliverables: scenario.deliverables,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ project: data });
  } catch (err) {
    console.error('Create project error:', err);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ projects: [] });

    const { data } = await supabase
      .from('simulator_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ projects: data || [] });
  } catch (err) {
    console.error('Get projects error:', err);
    return NextResponse.json({ projects: [] });
  }
}