import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // Force refresh: delete today's cache first
    if (forceRefresh) {
      await serviceClient.from('daily_tech_cache').delete().eq('date', today);
    }

    // Check cache first (fast path)
    let { data: cached } = await supabase
      .from('daily_tech_cache')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // Always fetch history for display
    const { data: history } = await supabase
      .from('daily_tech_cache')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    const { data: { user } } = await supabase.auth.getUser();
    let bookmarks: string[] = [];
    if (user) {
      const { data } = await supabase
        .from('daily_tech_bookmarks')
        .select('tech_date')
        .eq('user_id', user.id);
      bookmarks = (data || []).map((b: { tech_date: string }) => b.tech_date);
    }

    if (cached) {
      return NextResponse.json({ tech: cached, history: history || [], bookmarks, source: 'cache' });
    }

    // No cache for today — fetch latest article from real RSS data
    // Get existing tech titles to avoid duplicates (excluding today since we deleted it)
    const { data: existing } = await serviceClient
      .from('daily_tech_cache')
      .select('title, source_url')
      .order('date', { ascending: false })
      .limit(30);

    const existingUrls = new Set((existing ?? []).map((e: { source_url?: string }) => e.source_url).filter(Boolean));
    const existingTitles = new Set((existing ?? []).map((e: { title: string }) => e.title).filter(Boolean));

    // Fetch latest AI tech article from RSS that hasn't been used yet
    const { data: articles } = await serviceClient
      .from('daily_ai_news_articles')
      .select('title, url, source, summary, published_at, plain_explanation')
      .order('published_at', { ascending: false })
      .limit(50);

    // Find first unused article
    const freshArticle = (articles ?? []).find((a: { url: string; title: string }) =>
      !existingUrls.has(a.url) && !existingTitles.has(a.title)
    );

    let techData: { title: string; summary: string; explanation: string; impact: string; tags: string[]; source_url?: string };
    let sourceName = 'AI 技术日报';

    if (freshArticle) {
      // Parse plain_explanation JSON
      let explanation = freshArticle.summary || '';
      let impact = '';
      try {
        const pe = typeof freshArticle.plain_explanation === 'string'
          ? JSON.parse(freshArticle.plain_explanation)
          : freshArticle.plain_explanation;
        if (pe?.explanation) explanation = pe.explanation;
        if (pe?.impact) impact = pe.impact;
      } catch {}

      techData = {
        title: freshArticle.title,
        summary: explanation.slice(0, 100),
        explanation: explanation,
        impact: impact || '关注此技术动态，理解其对 AI PM 工作的影响',
        tags: [],
        source_url: freshArticle.url,
      };
      sourceName = freshArticle.source || 'AI 技术 RSS';
    } else {
      // No fresh articles — sync refresh RSS now with timeout
      console.log('No fresh RSS articles, triggering sync refresh...');

      // RSS refresh with 30s timeout
      const refreshWithTimeout = Promise.race([
        import('@/lib/rss/pipeline').then(({ refreshRssArticles }) => refreshRssArticles('ai_tech')),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('RSS refresh timeout')), 30000)),
      ]);

      try {
        const refreshResult = await refreshWithTimeout;
        console.log('RSS refresh result:', refreshResult);
      } catch (refreshErr) {
        console.error('RSS refresh error:', refreshErr);
      }

      // Re-fetch articles after refresh attempt
      const { data: newArticles } = await serviceClient
        .from('daily_ai_news_articles')
        .select('title, url, source, summary, published_at, plain_explanation')
        .order('published_at', { ascending: false })
        .limit(50);

      const freshAfterRefresh = (newArticles ?? []).find((a: { url: string; title: string }) =>
        !existingUrls.has(a.url) && !existingTitles.has(a.title)
      );

      if (freshAfterRefresh) {
        let explanation = freshAfterRefresh.summary || '';
        let impact = '';
        try {
          const pe = typeof freshAfterRefresh.plain_explanation === 'string'
            ? JSON.parse(freshAfterRefresh.plain_explanation)
            : freshAfterRefresh.plain_explanation;
          if (pe?.explanation) explanation = pe.explanation;
          if (pe?.impact) impact = pe.impact;
        } catch {}

        techData = {
          title: freshAfterRefresh.title,
          summary: explanation.slice(0, 100),
          explanation: explanation,
          impact: impact || '关注此技术动态，理解其对 AI PM 工作的影响',
          tags: [],
          source_url: freshAfterRefresh.url,
        };
        sourceName = freshAfterRefresh.source || 'AI 技术 RSS';
      } else if (newArticles && newArticles.length > 0) {
        // Use latest even if duplicate
        const latest = newArticles[0];
        let explanation = latest.summary || '';
        let impact = '';
        try {
          const pe = typeof latest.plain_explanation === 'string'
            ? JSON.parse(latest.plain_explanation)
            : latest.plain_explanation;
          if (pe?.explanation) explanation = pe.explanation;
          if (pe?.impact) impact = pe.impact;
        } catch {}

        techData = {
          title: latest.title || 'AI 技术动态',
          summary: explanation.slice(0, 100) || latest.summary?.slice(0, 100) || '来自 RSS 的最新 AI 技术资讯',
          explanation: explanation || latest.summary || '请查看原文了解详情',
          impact: impact || '持续关注 AI 技术发展对产品决策至关重要',
          tags: [],
          source_url: latest.url || '',
        };
        sourceName = latest.source || 'AI 技术 RSS';
      } else if (history && history.length > 0) {
        // Fallback to most recent history item
        const recent = history[0];
        techData = {
          title: recent.title,
          summary: recent.summary || '',
          explanation: recent.explanation || recent.summary || '',
          impact: recent.impact || '持续关注 AI 技术发展对产品决策至关重要',
          tags: recent.tags || [],
          source_url: recent.source_url,
        };
        sourceName = recent.source_name || 'AI 技术日报';
      } else {
        // No data at all
        return NextResponse.json({
          tech: {
            date: today,
            title: '暂无AI技术资讯',
            summary: 'RSS数据刷新中，请稍后重试',
            explanation: '系统正在从多个AI技术源获取最新资讯，请稍后刷新页面查看。',
            impact: '建议稍后刷新页面，或查看历史推送中的内容。',
            tags: [],
            source_name: '系统提示',
          },
          history: history || [],
          bookmarks,
          source: 'fallback',
        });
      }
    }

    const newTech = {
      date: today,
      ...techData,
      source_name: sourceName,
    };

    const { data: inserted } = await serviceClient
      .from('daily_tech_cache')
      .insert(newTech)
      .select()
      .single();

    // Refresh history after insert
    const { data: updatedHistory } = await serviceClient
      .from('daily_tech_cache')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({ tech: inserted || newTech, history: updatedHistory || history || [], bookmarks, source: 'ai' });
  } catch (err) {
    console.error('Get daily tech error:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

    const body = await request.json();
    const { action, tech_date, tech_data } = body as {
      action: 'bookmark' | 'unbookmark';
      tech_date: string;
      tech_data?: { title?: string; summary?: string; explanation?: string; impact?: string; tags?: string[]; source_url?: string };
    };

    if (action === 'bookmark') {
      const { error } = await supabase
        .from('daily_tech_bookmarks')
        .insert({
          user_id: user.id,
          tech_date,
          title: tech_data?.title || '未命名',
          summary: tech_data?.summary || null,
          explanation: tech_data?.explanation || null,
          impact: tech_data?.impact || null,
          tags: tech_data?.tags || [],
          source_url: tech_data?.source_url || null,
        });
      if (error && !error.message.includes('duplicate')) {
        console.error('Bookmark insert error:', error);
        return NextResponse.json({ error: '收藏失败' }, { status: 500 });
      }
      return NextResponse.json({ bookmarked: true });
    }

    if (action === 'unbookmark') {
      await supabase
        .from('daily_tech_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('tech_date', tech_date);
      return NextResponse.json({ bookmarked: false });
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
