import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'all';
    const now = new Date();
    let dateFrom: string | undefined;
    if (range === '7d') {
      dateFrom = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    } else if (range === '30d') {
      dateFrom = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    }

    // 获取所有数据用于计算环比
    const { data: allApps, error: allError } = await supabase
      .from('resume_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: true });

    if (allError) return NextResponse.json({ error: '获取看板数据失败', code: 'INTERNAL_ERROR' }, { status: 500 });

    const allApplications = allApps || [];

    // 根据时间范围筛选
    let applications = allApplications;
    if (dateFrom) {
      applications = allApplications.filter(a => a.applied_at >= dateFrom);
    }

    // 计算当前周期数据
    const total = applications.length;
    const interviewStatuses = ['初面', '二面', '终面'];
    const interviewedApps = applications.filter((a) => interviewStatuses.includes(a.status));
    const interviews = interviewedApps.length;
    const offers = applications.filter((a) => a.status === '已发offer' || a.status === '已接受').length;
    const accepted = applications.filter((a) => a.status === '已接受').length;
    const rejected = applications.filter((a) => a.status === '已拒绝').length;
    const totalInterviewed = interviews + offers + accepted + rejected;
    const interviewPassRate = totalInterviewed > 0 ? Math.round((offers + accepted + rejected) / totalInterviewed * 100) : 0;
    const offerAcceptanceRate = offers > 0 ? Math.round((accepted / offers) * 100) : 0;

    // 计算上一周期数据（环比）
    const today = new Date();
    const thisWeekStart = new Date(today.getTime() - 7 * 86400000);
    const lastWeekStart = new Date(today.getTime() - 14 * 86400000);
    const thisWeekEnd = today.toISOString().slice(0, 10);
    const lastWeekEnd = thisWeekStart.toISOString().slice(0, 10);
    const lastWeekStartStr = lastWeekStart.toISOString().slice(0, 10);

    // 本周数据
    const thisWeekApps = allApplications.filter(a => a.applied_at >= thisWeekStart.toISOString().slice(0, 10) && a.applied_at <= thisWeekEnd);
    const thisWeekTotal = thisWeekApps.length;
    const thisWeekInterviews = thisWeekApps.filter(a => interviewStatuses.includes(a.status)).length;
    const thisWeekOffers = thisWeekApps.filter(a => a.status === '已发offer' || a.status === '已接受').length;
    const thisWeekRejected = thisWeekApps.filter(a => a.status === '已拒绝').length;

    // 上周数据
    const lastWeekApps = allApplications.filter(a => a.applied_at >= lastWeekStartStr && a.applied_at < lastWeekEnd);
    const lastWeekTotal = lastWeekApps.length;
    const lastWeekInterviews = lastWeekApps.filter(a => interviewStatuses.includes(a.status)).length;
    const lastWeekOffers = lastWeekApps.filter(a => a.status === '已发offer' || a.status === '已接受').length;
    const lastWeekRejected = lastWeekApps.filter(a => a.status === '已拒绝').length;

    // 计算环比变化百分比
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalApplicationsChange = calcChange(thisWeekTotal, lastWeekTotal);
    const interviewCountChange = calcChange(thisWeekInterviews, lastWeekInterviews);
    const offersReceivedChange = calcChange(thisWeekOffers, lastWeekOffers);
    const rejectionCountChange = calcChange(thisWeekRejected, lastWeekRejected);

    // Offer 转化率变化
    const thisWeekOfferAcceptRate = thisWeekOffers > 0 ? Math.round((thisWeekApps.filter(a => a.status === '已接受').length / thisWeekOffers) * 100) : 0;
    const lastWeekOfferAcceptRate = lastWeekOffers > 0 ? Math.round((lastWeekApps.filter(a => a.status === '已接受').length / lastWeekOffers) * 100) : 0;
    const offerAcceptanceRateChange = lastWeekOfferAcceptRate > 0 ? thisWeekOfferAcceptRate - lastWeekOfferAcceptRate : (thisWeekOfferAcceptRate > 0 ? 100 : 0);

    // Channel distribution
    const channelMap = new Map<string, number>();
    for (const a of applications) {
      channelMap.set(a.channel, (channelMap.get(a.channel) || 0) + 1);
    }
    const channelDistribution = Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    // Status distribution
    const statusMap = new Map<string, number>();
    for (const a of applications) {
      statusMap.set(a.status, (statusMap.get(a.status) || 0) + 1);
    }
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    // Application trend - 最近7天数据
    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const count = allApplications.filter(a => a.applied_at === dateStr).length;
      last7Days.push({ date: dateStr, count });
    }

    // Status timeline - 最近7天
    const statusTimeline: { date: string; status: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayApps = allApplications.filter(a => a.applied_at === dateStr);
      const dayStatusMap = new Map<string, number>();
      for (const a of dayApps) {
        dayStatusMap.set(a.status, (dayStatusMap.get(a.status) || 0) + 1);
      }
      for (const [status, count] of dayStatusMap) {
        statusTimeline.push({ date: dateStr, status, count });
      }
    }

    // City distribution
    const cityMap = new Map<string, number>();
    for (const a of applications) {
      if (a.city) cityMap.set(a.city, (cityMap.get(a.city) || 0) + 1);
    }
    const cityDistribution = Array.from(cityMap.entries()).map(([city, count]) => ({ city, count }));
    cityDistribution.sort((a, b) => b.count - a.count);

    // Position category conversion
    const catMap = new Map<string, { total: number; interviews: number; offers: number }>();
    for (const a of applications) {
      const cat = a.position_category || '未分类';
      const entry = catMap.get(cat) || { total: 0, interviews: 0, offers: 0 };
      entry.total++;
      if (interviewStatuses.includes(a.status) || a.status === '已发offer' || a.status === '已接受' || a.status === '已拒绝') {
        entry.interviews++;
      }
      if (a.status === '已发offer' || a.status === '已接受') entry.offers++;
      catMap.set(cat, entry);
    }
    const positionCategoryConversion = Array.from(catMap.entries()).map(([category, v]) => ({
      category,
      total: v.total,
      interviews: v.interviews,
      offers: v.offers,
    }));

    // Funnel stages
    const funnelStages = [
      { stage: '投递', count: total },
      { stage: '筛选通过', count: applications.filter((a) => a.status !== '已投递').length },
      { stage: '面试中', count: interviews },
      { stage: '终面', count: applications.filter((a) => a.status === '终面' || a.status === '已发offer' || a.status === '已接受').length },
      { stage: 'Offer', count: offers },
      { stage: '接受', count: accepted },
    ];

    // Rejection reasons
    const rejectionMap = new Map<string, number>();
    for (const a of applications) {
      if (a.status === '已拒绝' && a.notes) {
        const reason = a.notes.length > 30 ? a.notes.slice(0, 30) + '...' : a.notes;
        rejectionMap.set(reason, (rejectionMap.get(reason) || 0) + 1);
      }
    }
    const rejectionReasons = Array.from(rejectionMap.entries()).map(([reason, count]) => ({ reason, count }));

    // Recent reviews
    const recentReviews = applications
      .filter((a) => a.notes || a.status !== '已投递')
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        company_name: a.company_name,
        position_name: a.position_name,
        status: a.status,
        notes: a.notes,
        updated_at: a.updated_at,
      }));

    const stats = {
      total_applications: total,
      interview_count: interviews,
      interview_pass_rate: interviewPassRate,
      offers_received: offers,
      offer_acceptance_rate: offerAcceptanceRate,
      rejection_count: rejected,
      rejection_reasons: rejectionReasons,
      channel_distribution: channelDistribution,
      status_distribution: statusDistribution,
      application_trend: last7Days,
      status_timeline: statusTimeline,
      city_distribution: cityDistribution,
      position_category_conversion: positionCategoryConversion,
      funnel_stages: funnelStages,
      recent_reviews: recentReviews,
      // 环比变化
      total_applications_change: totalApplicationsChange,
      interview_count_change: interviewCountChange,
      offers_received_change: offersReceivedChange,
      offer_acceptance_rate_change: offerAcceptanceRateChange,
      rejection_count_change: rejectionCountChange,
    };

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('Resume dashboard GET error:', err);
    return NextResponse.json({ error: '服务器内部错误', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
