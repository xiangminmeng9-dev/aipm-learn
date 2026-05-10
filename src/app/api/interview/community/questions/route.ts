import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validateBody, submitCommunityQuestionSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('page_size') || '20')));
    const sort = searchParams.get('sort') || 'latest';
    const typeId = searchParams.get('type_id') || null;

    const serviceClient = createServiceClient();

    // Count
    let countQuery = serviceClient.from('community_questions').select('id', { count: 'exact', head: true }).eq('status', 'active');
    if (typeId) countQuery = countQuery.eq('type_id', typeId);
    const { count } = await countQuery;

    // Fetch questions
    let query = serviceClient.from('community_questions')
      .select('id, text, type_id, user_id, created_at, question_types(name)')
      .eq('status', 'active');
    if (typeId) query = query.eq('type_id', typeId);
    query = sort === 'trending'
      ? query.order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false });
    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: '查询失败' }, { status: 500 });

    const questionIds = (data ?? []).map((q) => q.id);

    // Get vote aggregates
    let voteMap: Record<string, { upvotes: number; downvotes: number; user_vote: 1 | -1 | null }> = {};
    if (questionIds.length > 0) {
      const { data: votes } = await serviceClient
        .from('community_question_votes')
        .select('question_id, vote, user_id')
        .in('question_id', questionIds);
      for (const v of votes ?? []) {
        if (!voteMap[v.question_id]) voteMap[v.question_id] = { upvotes: 0, downvotes: 0, user_vote: null };
        if (v.vote === 1) voteMap[v.question_id].upvotes++;
        else voteMap[v.question_id].downvotes++;
        if (v.user_id === user.id) voteMap[v.question_id].user_vote = v.vote as 1 | -1;
      }
    }

    const records = (data ?? []).map((q) => {
      const qt = (q.question_types as unknown as { name: string }[])?.[0];
      const votes = voteMap[q.id] || { upvotes: 0, downvotes: 0, user_vote: null };
      return {
        id: q.id,
        text: q.text,
        type_id: q.type_id,
        type_name: qt?.name ?? null,
        user_id: q.user_id,
        created_at: q.created_at,
        upvotes: votes.upvotes,
        downvotes: votes.downvotes,
        user_vote: votes.user_vote,
      };
    });

    if (sort === 'trending') {
      records.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return NextResponse.json({ data: records, total: count ?? 0, page, page_size: pageSize });
  } catch (err) {
    console.error('Community questions GET error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(submitCommunityQuestionSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { text, type_id } = validation.data;
    const { data, error } = await supabase
      .from('community_questions')
      .insert({ text: text.trim(), type_id: type_id || null, user_id: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ question: data }, { status: 201 });
  } catch (err) {
    console.error('Community questions POST error:', err);
    return NextResponse.json({ error: '提交失败' }, { status: 500 });
  }
}
