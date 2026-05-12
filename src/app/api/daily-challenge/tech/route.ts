import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Check cache first (fast path)
    let { data: cached } = await supabase
      .from('daily_tech_cache')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // Force refresh: delete old and regenerate
    if (forceRefresh && cached) {
      const serviceClient = createServiceClient();
      await serviceClient.from('daily_tech_cache').delete().eq('date', today);
      cached = null;
    }

    if (cached) {
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

      return NextResponse.json({ tech: cached, history: history || [], bookmarks, source: 'cache' });
    }

    // No cache — fetch latest article from real RSS data
    const serviceClient = createServiceClient();

    // Get existing tech titles to avoid duplicates
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
    } else if (articles && articles.length > 0) {
      // Fallback: use latest article even if duplicate
      const latest = articles[0];
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
    } else {
      // No RSS data — trigger refresh to get latest articles
      console.log('No RSS articles found, triggering refresh...');

      try {
        // Import and call refresh function
        const { refreshRssArticles } = await import('@/lib/rss/pipeline');
        await refreshRssArticles('ai_tech');

        // Re-fetch after refresh
        const { data: freshArticles } = await serviceClient
          .from('daily_ai_news_articles')
          .select('title, url, source, summary, published_at, plain_explanation')
          .order('published_at', { ascending: false })
          .limit(50);

        const freshArticle = (freshArticles ?? []).find((a: { url: string; title: string }) =>
          !existingUrls.has(a.url) && !existingTitles.has(a.title)
        );

        if (freshArticle) {
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
          // Still no data after refresh — show message asking user to try again
          return NextResponse.json({
            tech: {
              date: today,
              title: '正在获取最新AI技术资讯',
              summary: '系统正在从各大AI技术源获取最新内容，请稍后刷新页面',
              explanation: '我们的系统正在从 OpenAI Blog、Hugging Face、Google AI 等多个源头抓取最新的AI技术动态。通常几分钟内就能获取到最新内容。',
              impact: '请稍后刷新页面查看今日最新AI技术资讯',
              tags: [],
              source_name: 'AI 技术日报',
            },
            history: [],
            bookmarks: [],
            source: 'loading',
          });
        }
      } catch (refreshErr) {
        console.error('RSS refresh failed:', refreshErr);
        return NextResponse.json({
          tech: {
            date: today,
            title: '获取AI技术资讯中',
            summary: '系统正在获取最新内容，请稍后刷新',
            explanation: '我们的系统正在从多个AI技术源头获取最新动态。如果长时间无内容，请手动点击刷新按钮。',
            impact: '请稍后刷新页面，或点击页面上的刷新按钮重新获取',
            tags: [],
            source_name: 'AI 技术日报',
          },
          history: [],
          bookmarks: [],
          source: 'loading',
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

    const { data: history } = await serviceClient
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

    return NextResponse.json({ tech: inserted || newTech, history: history || [], bookmarks, source: 'ai' });
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
