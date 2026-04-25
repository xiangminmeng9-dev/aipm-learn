import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, task_type, type, title, url, source, notes } = body as {
      task_id: string;
      task_type: 'seed' | 'jd_gap' | 'custom_module';
      type: 'article' | 'video' | 'book' | 'note';
      title: string;
      url?: string;
      source?: string;
      notes?: string;
    };

    if (!task_id || !task_type || !type || !title?.trim()) {
      return NextResponse.json({ error: '缺少必填字段', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (type !== 'note' && !url?.trim()) {
      return NextResponse.json({ error: '非笔记类型需要提供链接', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_task_resources')
      .insert({
        user_id: user.id,
        task_id,
        task_type,
        type,
        title: title.trim(),
        url: url?.trim() ?? '',
        source: source?.trim() ?? '',
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '添加资源失败', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ resource: data });
  } catch (error) {
    console.error('Add resource API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
