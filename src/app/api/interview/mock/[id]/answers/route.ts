import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Fallback: try Authorization header
    let authenticatedUser = user;
    if (!authenticatedUser) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user: headerUser } } = await supabase.auth.getUser(token);
        authenticatedUser = headerUser;
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id: mockId } = await params;

    // Verify the mock interview belongs to this user
    const serviceClient = createServiceClient();
    const { data: mockInterview } = await serviceClient
      .from('mock_interviews')
      .select('id')
      .eq('id', mockId)
      .eq('user_id', authenticatedUser.id)
      .single();

    if (!mockInterview) {
      return NextResponse.json({ error: '面试不存在' }, { status: 404 });
    }

    // Get all answers for this mock interview
    const { data: answers, error } = await serviceClient
      .from('interview_answers')
      .select('id, question_number, question_text, user_answer, score, gap_analysis, perfect_answer, is_skipped, answered_at')
      .eq('mock_interview_id', mockId)
      .order('question_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: '获取答案失败' }, { status: 500 });
    }

    return NextResponse.json({ answers: answers || [] });
  } catch (error) {
    console.error('Get mock answers error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}