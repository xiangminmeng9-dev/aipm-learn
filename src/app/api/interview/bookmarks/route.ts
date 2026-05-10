import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validateBody, bookmarkQuestionSchema, updateBookmarkSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('page_size') || '20')));
    const masteryLevel = searchParams.get('mastery_level') || null;

    const serviceClient = createServiceClient();

    let countQuery = serviceClient
      .from('user_question_bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (masteryLevel) countQuery = countQuery.eq('mastery_level', masteryLevel);
    const { count } = await countQuery;

    let query = serviceClient
      .from('user_question_bookmarks')
      .select('id, question_id, mastery_level, notes, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (masteryLevel) query = query.eq('mastery_level', masteryLevel);
    const { data, error } = await query;

    if (error) return NextResponse.json({ error: '查询失败' }, { status: 500 });

    // Enrich with question text and type name
    const questionIds = (data ?? []).map((b) => b.question_id);
    let questionMap: Record<string, { text: string; type_name: string | null; type_id: string | null }> = {};
    if (questionIds.length > 0) {
      const { data: questions } = await serviceClient
        .from('interview_questions')
        .select('id, text, type_id, question_types(name)')
        .in('id', questionIds);
      for (const q of questions ?? []) {
        const qt = (q.question_types as unknown as { name: string }[])?.[0];
        questionMap[q.id] = { text: q.text, type_name: qt?.name ?? null, type_id: q.type_id };
      }
    }

    const records = (data ?? []).map((b) => ({
      ...b,
      question_text: questionMap[b.question_id]?.text ?? '(已删除)',
      type_name: questionMap[b.question_id]?.type_name ?? null,
      type_id: questionMap[b.question_id]?.type_id ?? null,
    }));

    return NextResponse.json({ data: records, total: count ?? 0, page, page_size: pageSize });
  } catch (err) {
    console.error('Bookmarks GET error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(bookmarkQuestionSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { question_id, mastery_level, notes } = validation.data;

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('user_question_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ bookmark: existing, already_exists: true });
    }

    const { data, error } = await supabase
      .from('user_question_bookmarks')
      .insert({
        user_id: user.id,
        question_id,
        mastery_level: mastery_level || 'learning',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bookmark: data, already_exists: false }, { status: 201 });
  } catch (err) {
    console.error('Bookmarks POST error:', err);
    return NextResponse.json({ error: '收藏失败' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(updateBookmarkSchema, body);
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { id, mastery_level, notes } = validation.data;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (mastery_level !== undefined) updates.mastery_level = mastery_level;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('user_question_bookmarks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: '更新失败' }, { status: 500 });
    return NextResponse.json({ bookmark: data });
  } catch (err) {
    console.error('Bookmarks PATCH error:', err);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: '缺少书签 ID' }, { status: 400 });

    const { error } = await supabase
      .from('user_question_bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: '删除失败' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Bookmarks DELETE error:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
