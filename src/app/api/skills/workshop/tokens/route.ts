import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';
export const dynamic = 'force-dynamic';

// Mask token: show only last 4 characters
function maskToken(token: string): string {
  if (token.length <= 4) return '****';
  return '*'.repeat(token.length - 4) + token.slice(-4);
}

// GET: List user's tokens (masked)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient
      .from('user_external_tokens')
      .select('id, provider, token, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[skill-tokens-list] DB error:', error.message);
      return NextResponse.json({ tokens: [] });
    }

    // Mask token values
    const tokens = (data || []).map((row) => {
      let displayToken = '****';
      try {
        const raw = decrypt(row.token);
        displayToken = maskToken(raw);
      } catch {
        // If decryption fails, mask the stored value directly
        displayToken = maskToken(row.token);
      }
      return {
        id: row.id,
        provider: row.provider,
        token_masked: displayToken,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ tokens });
  } catch (err) {
    console.error('[skill-tokens-list] Error:', err);
    return NextResponse.json({ tokens: [] });
  }
}

// POST: Save/update token
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, token } = body as {
      provider?: string;
      token?: string;
    };

    if (!provider?.trim() || !['clawhub', 'skillssh'].includes(provider)) {
      return NextResponse.json(
        { error: '无效的 provider，支持 clawhub 或 skillssh' },
        { status: 400 }
      );
    }

    if (!token?.trim()) {
      return NextResponse.json({ error: 'Token 不能为空' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Encrypt token before storing
    const encryptedToken = encrypt(token.trim());

    // Upsert: insert or update if (user_id, provider) already exists
    const { data, error } = await serviceClient
      .from('user_external_tokens')
      .upsert(
        {
          user_id: user.id,
          provider: provider.trim(),
          token: encryptedToken,
        },
        { onConflict: 'user_id,provider' }
      )
      .select('id, provider, created_at')
      .single();

    if (error) {
      console.error('[skill-tokens-save] DB error:', error.message);
      return NextResponse.json({ error: '保存 Token 失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token: {
        id: data.id,
        provider: data.provider,
        token_masked: maskToken(token.trim()),
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error('[skill-tokens-save] Error:', err);
    return NextResponse.json({ error: '保存 Token 失败' }, { status: 500 });
  }
}

// DELETE: Remove token
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body as { provider?: string };

    if (!provider?.trim()) {
      return NextResponse.json({ error: '缺少 provider' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from('user_external_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider.trim());

    if (error) {
      console.error('[skill-tokens-delete] DB error:', error.message);
      return NextResponse.json({ error: '删除 Token 失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[skill-tokens-delete] Error:', err);
    return NextResponse.json({ error: '删除 Token 失败' }, { status: 500 });
  }
}
