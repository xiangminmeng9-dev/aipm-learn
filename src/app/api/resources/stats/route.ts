import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const uid = user.id;

    const [
      resourcesResult,
      sourceResult,
      activityResult,
      folderResult,
      rssResult,
      rssReadResult,
      newsResult,
      rssSourcesResult,
    ] = await Promise.all([
      // 1. User resources: type distribution
      supabase.from('external_resources').select('type').eq('user_id', uid),
      // 2. Source distribution
      supabase.from('external_resources').select('source').eq('user_id', uid),
      // 3. 30-day daily activity
      supabase
        .from('external_resources')
        .select('created_at')
        .eq('user_id', uid)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('created_at', { ascending: true }),
      // 4. Folder structure for treemap
      supabase.from('external_resources').select('id, title, parent_id, type').eq('user_id', uid),
      // 5. RSS category distribution
      supabase.from('rss_articles').select('category'),
      // 6. RSS read/translated stats
      supabase.from('rss_articles').select('is_read, is_translated'),
      // 7. Daily news recent
      supabase
        .from('daily_ai_news_digests')
        .select('news_date, article_count')
        .order('news_date', { ascending: false })
        .limit(7),
      // 8. RSS sources count
      supabase.from('rss_sources').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    // --- Type distribution ---
    const typeMap: Record<string, number> = {};
    const resources = resourcesResult.data ?? [];
    for (const r of resources) {
      const t = r.type || 'unknown';
      typeMap[t] = (typeMap[t] || 0) + 1;
    }
    const type_distribution = Object.entries(typeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // --- Source distribution ---
    const sourceMap: Record<string, number> = {};
    for (const r of sourceResult.data ?? []) {
      const s = r.source?.trim() || '未分类';
      sourceMap[s] = (sourceMap[s] || 0) + 1;
    }
    const source_distribution = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // --- 30-day daily activity ---
    const dayMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dayMap[d.toISOString().split('T')[0]] = 0;
    }
    for (const r of activityResult.data ?? []) {
      const day = r.created_at?.split('T')[0];
      if (day && day in dayMap) dayMap[day]++;
    }
    const daily_activity = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // --- Growth timeline (cumulative) ---
    let cumulative = 0;
    const baseCount = resources.length - (activityResult.data?.length ?? 0);
    const growth_timeline = daily_activity.map((d) => {
      cumulative += d.count;
      return { date: d.date, count: baseCount + cumulative };
    });

    // --- Folder treemap ---
    const folders = (folderResult.data ?? []).filter((r) => r.type === 'folder');
    const folderChildren: Record<string, { name: string; value: number }[]> = {};
    for (const r of folderResult.data ?? []) {
      if (r.type !== 'folder' && r.parent_id) {
        if (!folderChildren[r.parent_id]) folderChildren[r.parent_id] = [];
        folderChildren[r.parent_id].push({ name: r.title, value: 1 });
      }
    }
    const folder_treemap: { name: string; value: number; children?: { name: string; value: number }[] }[] = folders.map((f) => ({
      name: f.title,
      value: (folderChildren[f.id] ?? []).length || 1,
      children: folderChildren[f.id]?.length ? folderChildren[f.id] : undefined,
    }));
    // Unfiled resources (use folderResult which has id + parent_id + type)
    const allItems = folderResult.data ?? [];
    const filedSet = new Set(allItems.filter((r) => r.parent_id).map((r) => r.id));
    const unfiled = allItems.filter((r) => !r.parent_id && r.type !== 'folder' && !filedSet.has(r.id)).length;
    if (unfiled > 0) folder_treemap.push({ name: '未分类', value: unfiled });

    // --- RSS category distribution ---
    const catMap: Record<string, number> = {};
    for (const r of rssResult.data ?? []) {
      const c = r.category || 'unknown';
      catMap[c] = (catMap[c] || 0) + 1;
    }
    const rss_category_distribution = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // --- RSS read stats ---
    const rssReadData = rssReadResult.data ?? [];
    const rss_read_stats = {
      total: rssReadData.length,
      read: rssReadData.filter((r) => r.is_read).length,
      translated: rssReadData.filter((r) => r.is_translated).length,
    };

    // --- Daily news recent ---
    const daily_news_recent = (newsResult.data ?? []).map((d) => ({
      date: d.news_date,
      article_count: d.article_count ?? 0,
    }));

    return NextResponse.json({
      total_resources: resources.length,
      total_rss_articles: rssReadData.length,
      total_daily_news: newsResult.data?.length ?? 0,
      total_rss_sources: rssSourcesResult.count ?? 0,
      type_distribution,
      source_distribution,
      daily_activity,
      growth_timeline,
      folder_treemap,
      rss_category_distribution,
      rss_read_stats,
      daily_news_recent,
    });
  } catch (error) {
    console.error('Resources stats API error:', error);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
