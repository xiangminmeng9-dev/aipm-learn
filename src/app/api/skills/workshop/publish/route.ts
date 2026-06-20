import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { publishSkill } from '@/lib/clawhub/client';
import { decrypt } from '@/lib/crypto';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { draft_id, platform } = body as {
      draft_id?: string;
      platform?: 'clawhub' | 'skillssh';
    };

    if (!draft_id) {
      return NextResponse.json({ error: '缺少 draft_id' }, { status: 400 });
    }

    if (!platform || !['clawhub', 'skillssh'].includes(platform)) {
      return NextResponse.json({ error: '无效的平台，支持 clawhub 或 skillssh' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Fetch draft
    const { data: draft, error: draftError } = await serviceClient
      .from('user_skill_drafts')
      .select('id, name, content, status, clawhub_slug, skillssh_slug')
      .eq('id', draft_id)
      .eq('user_id', user.id)
      .single();

    if (draftError || !draft) {
      return NextResponse.json({ error: '未找到草稿' }, { status: 404 });
    }

    if (!draft.content?.trim()) {
      return NextResponse.json({ error: '草稿内容为空' }, { status: 400 });
    }

    // Fetch token for the platform
    const { data: tokenRow } = await serviceClient
      .from('user_external_tokens')
      .select('token')
      .eq('user_id', user.id)
      .eq('provider', platform)
      .single();

    if (!tokenRow?.token) {
      return NextResponse.json(
        {
          error: '未配置 API Token',
          mode: 'cli_fallback',
          content: draft.content,
        },
        { status: 400 }
      );
    }

    // Decrypt token
    let apiToken: string;
    try {
      apiToken = decrypt(tokenRow.token);
    } catch {
      // If decryption fails, use raw token (might be stored as plaintext)
      apiToken = tokenRow.token;
    }

    // Handle by platform
    if (platform === 'clawhub') {
      try {
        const result = await publishSkill(draft.content, apiToken, {
          name: draft.name,
          slug: draft.clawhub_slug || undefined,
        });

        // Update draft status
        await serviceClient
          .from('user_skill_drafts')
          .update({
            status: 'published',
            clawhub_slug: result.slug,
            clawhub_url: result.url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draft_id)
          .eq('user_id', user.id);

        return NextResponse.json({
          success: true,
          platform: 'clawhub',
          slug: result.slug,
          url: result.url,
          version: result.version,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '发布到 ClawHub 失败';
        console.error('[skill-publish] ClawHub error:', msg);
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }

    if (platform === 'skillssh') {
      // skills.sh requires Vercel OIDC — not supported for online publishing in v1
      // Return CLI instructions
      const cliCommand = `npx skills-sh publish --content "${draft.name.replace(/"/g, '\\"')}"`;
      return NextResponse.json(
        {
          error: 'skills.sh 暂不支持在线发布',
          mode: 'cli_fallback',
          content: draft.content,
          cli_command: cliCommand,
          instructions: [
            '1. 确保已安装 skills.sh CLI：npm install -g skills-sh',
            '2. 在终端中运行：npx skills-sh login',
            '3. 将 SKILL.md 内容保存到本地文件',
            `4. 运行：npx skills-sh publish --file SKILL.md`,
            '5. skills.sh 使用 Vercel OIDC 认证，需要在 Vercel 项目环境中操作',
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: '不支持的平台' }, { status: 400 });
  } catch (err) {
    console.error('[skill-publish] Error:', err);
    const msg = err instanceof Error ? err.message : '发布失败';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
