import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';



const INTERVIEW_STATUSES = ['初面', '二面', '终面'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all';
    const now = new Date();

    let dateFrom: string | undefined;
    if (range === '7d') dateFrom = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    else if (range === '30d') dateFrom = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

    const appsResult = await supabase
      .from('resume_applications')
      .select('id, company_name, position_name, status, channel, city, position_category, applied_at, notes, updated_at')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: true })
      .limit(500);

    if (appsResult.error) {
      console.error('resume_applications query error:', appsResult.error);
      return NextResponse.json({ error: '获取数据失败，请稍后重试' }, { status: 500 });
    }

    const allApps = appsResult.data || [];

    // --- Single-pass aggregation ---
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    let total = 0, interviews = 0, offers = 0, accepted = 0, rejected = 0;
    let screened = 0, finalInterview = 0;
    let thisWeekTotal = 0, thisWeekInterviews = 0, thisWeekOffers = 0, thisWeekRejected = 0, thisWeekAccepted = 0;
    let lastWeekTotal = 0, lastWeekInterviews = 0, lastWeekOffers = 0, lastWeekRejected = 0;

    const channelMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const catMap = new Map<string, { total: number; interviews: number; offers: number }>();
    const trendMap = new Map<string, number>();
    const rejectionMap = new Map<string, number>();
    const recentReviews: Array<{ id: string; company_name: string; position_name: string; status: string; notes: string | null; updated_at: string }> = [];

    for (const a of allApps) {
      const appliedAt = a.applied_at;
      const status = a.status;
      const isInRange = !dateFrom || appliedAt >= dateFrom;
      const isThisWeek = appliedAt >= weekAgo && appliedAt <= today;
      const isLastWeek = appliedAt >= twoWeeksAgo && appliedAt < weekAgo;

      // Trend
      trendMap.set(appliedAt, (trendMap.get(appliedAt) || 0) + 1);

      // Status
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
      const isInterview = INTERVIEW_STATUSES.includes(status);
      const isOffer = status === '已发offer' || status === '已接受';
      const isAccepted = status === '已接受';
      const isRejected = status === '已拒绝';

      if (isInRange) {
        total++;
        if (isInterview) interviews++;
        if (isOffer) offers++;
        if (isAccepted) accepted++;
        if (isRejected) rejected++;
        if (status !== '已投递') screened++;
        if (status === '终面' || isOffer) finalInterview++;

        // Channel
        channelMap.set(a.channel, (channelMap.get(a.channel) || 0) + 1);
        // City
        if (a.city) cityMap.set(a.city, (cityMap.get(a.city) || 0) + 1);
        // Category
        const cat = a.position_category || '未分类';
        const entry = catMap.get(cat) || { total: 0, interviews: 0, offers: 0 };
        entry.total++;
        if (isInterview || isOffer || isRejected) entry.interviews++;
        if (isOffer) entry.offers++;
        catMap.set(cat, entry);

        // Rejection reasons
        if (isRejected && a.notes) {
          const reason = a.notes.length > 30 ? a.notes.slice(0, 30) + '...' : a.notes;
          rejectionMap.set(reason, (rejectionMap.get(reason) || 0) + 1);
        }

        // Recent reviews
        if ((a.notes || status !== '已投递') && recentReviews.length < 10) {
          recentReviews.push({ id: a.id, company_name: a.company_name, position_name: a.position_name, status, notes: a.notes, updated_at: a.updated_at });
        }
      }

      // Week-over-week
      if (isThisWeek) {
        thisWeekTotal++;
        if (isInterview) thisWeekInterviews++;
        if (isOffer) thisWeekOffers++;
        if (isRejected) thisWeekRejected++;
        if (isAccepted) thisWeekAccepted++;
      }
      if (isLastWeek) {
        lastWeekTotal++;
        if (isInterview) lastWeekInterviews++;
        if (isOffer) lastWeekOffers++;
        if (isRejected) lastWeekRejected++;
      }
    }

    const interviewPassRate = (interviews + offers + accepted + rejected) > 0
      ? Math.round(((offers + accepted + rejected) / (interviews + offers + accepted + rejected)) * 100) : 0;
    const offerAcceptanceRate = offers > 0 ? Math.round((accepted / offers) * 100) : 0;

    const calcChange = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    let lastWeekAcceptedCount = 0;
    for (const a of allApps) {
      if (a.applied_at >= twoWeeksAgo && a.applied_at < weekAgo && a.status === '已接受') lastWeekAcceptedCount++;
    }
    const thisWeekOfferAcceptRate = thisWeekOffers > 0 ? Math.round((thisWeekAccepted / thisWeekOffers) * 100) : 0;
    const lastWeekOfferAcceptRate = lastWeekOffers > 0 ? Math.round((lastWeekAcceptedCount / lastWeekOffers) * 100) : 0;
    const offerAcceptanceRateChange = lastWeekOfferAcceptRate > 0 ? thisWeekOfferAcceptRate - lastWeekOfferAcceptRate : (thisWeekOfferAcceptRate > 0 ? 100 : 0);

    // Build trend array
    const trendDays = range === '7d' ? 7 : 30;
    const applicationTrend = Array.from({ length: trendDays }, (_, i) => {
      const d = new Date(now.getTime() - (trendDays - 1 - i) * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      return { date: dateStr, count: trendMap.get(dateStr) || 0, interviews: 0, offers: 0, accepted: 0 };
    });

    const channelDistribution = Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    const cityDistribution = Array.from(cityMap.entries()).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count);

    const positionCategoryConversion = Array.from(catMap.entries()).map(([category, v]) => ({
      category, total: v.total, interviews: v.interviews, offers: v.offers,
    }));

    const funnelStages = [
      { stage: '投递', count: total },
      { stage: '筛选通过', count: screened },
      { stage: '面试中', count: interviews },
      { stage: '终面', count: finalInterview },
      { stage: 'Offer', count: offers },
      { stage: '接受', count: accepted },
    ];

    const rejectionReasons = Array.from(rejectionMap.entries()).map(([reason, count]) => ({ reason, count }));

    return NextResponse.json({
      stats: {
        total_applications: total,
        interview_count: interviews,
        interview_pass_rate: interviewPassRate,
        offers_received: offers,
        offer_acceptance_rate: offerAcceptanceRate,
        rejection_count: rejected,
        rejection_reasons: rejectionReasons,
        channel_distribution: channelDistribution,
        status_distribution: statusDistribution,
        application_trend: applicationTrend,
        status_timeline: [],
        city_distribution: cityDistribution,
        position_category_conversion: positionCategoryConversion,
        funnel_stages: funnelStages,
        recent_reviews: recentReviews,
        total_applications_change: calcChange(thisWeekTotal, lastWeekTotal),
        interview_count_change: calcChange(thisWeekInterviews, lastWeekInterviews),
        offers_received_change: calcChange(thisWeekOffers, lastWeekOffers),
        offer_acceptance_rate_change: offerAcceptanceRateChange,
        rejection_count_change: calcChange(thisWeekRejected, lastWeekRejected),
      },
    });
  } catch (err) {
    console.error('Resume dashboard GET error:', err);
    return NextResponse.json({ error: '服务器内部错误，请稍后重试' }, { status: 500 });
  }
}
