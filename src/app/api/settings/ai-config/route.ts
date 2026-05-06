import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';
import { validateBody, aiConfigSchema } from '@/lib/validations';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { data } = await supabase
      .from('user_ai_configs')
      .select('protocol, base_url, api_key, model, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.api_key) {
      try {
        data.api_key = decrypt(data.api_key);
      } catch {
        // Legacy unencrypted key, leave as-is
      }
    }

    return NextResponse.json({ config: data || null });
  } catch (err) {
    console.error('Get ai config error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const body = await request.json();
    const validation = validateBody(aiConfigSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { protocol, base_url, api_key, model } = validation.data;

    const encryptedKey = encrypt(api_key);

    const { data: existing } = await supabase
      .from('user_ai_configs')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_ai_configs')
        .update({ protocol, base_url: base_url || '', api_key: encryptedKey, model })
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from('user_ai_configs')
        .insert({ user_id: user.id, protocol, base_url: base_url || '', api_key: encryptedKey, model });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save ai config error:', err);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    await supabase.from('user_ai_configs').delete().eq('user_id', user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete ai config error:', err);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
