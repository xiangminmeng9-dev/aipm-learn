import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Check cache first (fast path)
    let { data: cached } = await supabase
      .from('daily_tech_cache')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (cached) {
      // Also get history and bookmarks for cached path
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

    // No cache — return default immediately, async generate AI version
    const defaultTech = {
      date: today,
      title: 'RAG 2.0：从检索增强到推理增强',
      summary: '新一代 RAG 架构正在从简单的检索增强，演进为结合推理能力的智能知识系统。',
      explanation: '传统 RAG 是"搜到什么用什么"，而 RAG 2.0 引入了推理链——先理解问题意图，再规划检索策略，最后对检索结果进行推理整合。这对 AI PM 意味着：产品不再只是"知识库+搜索"，而是需要设计推理流程、评估推理质量、管理知识图谱。',
      impact: 'AI PM 需要掌握推理链设计、知识质量评估、以及从"检索准确率"到"推理正确率"的指标体系升级。',
      tags: ['RAG', '推理', '知识图谱', 'AI架构'],
      source_name: 'AI 技术日报',
    };

    // Use service client to bypass RLS (no INSERT/UPDATE policy on daily_tech_cache)
    const serviceClient = createServiceClient();
    const { data: inserted } = await serviceClient
      .from('daily_tech_cache')
      .insert(defaultTech)
      .select()
      .single();

    // Async: try AI generation to upgrade
    generateAndUpgradeTech(today).catch((err) => {
      console.error('generateAndUpgradeTech failed:', err);
    });

    return NextResponse.json({ tech: inserted || defaultTech, source: 'default' });
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

async function generateAndUpgradeTech(date: string): Promise<void> {
  try {
    const serviceClient = createServiceClient();

    // Fetch existing titles to avoid duplicates
    const { data: existing } = await serviceClient
      .from('daily_tech_cache')
      .select('title')
      .order('date', { ascending: false })
      .limit(30);

    const existingTitles = (existing ?? []).map((e: { title: string }) => e.title).filter(Boolean);
    const avoidList = existingTitles.length > 0
      ? `\n\n以下标题已推送过，请勿重复或高度相似：\n${existingTitles.map((t: string) => `- ${t}`).join('\n')}`
      : '';

    const { generateText } = await import('@/lib/ai/claude');
    const aiResult = await generateText(
      `推荐一个今天AI领域最值得关注的技术动态，要求与之前推送的内容不重复，聚焦不同方向（如模型架构、应用场景、工具链、行业落地、开源动态等轮换）。只输出JSON：{"title":"标题","summary":"50字摘要","explanation":"200字白话解读，对AI PM意味着什么","impact":"对AI PM的影响，100字","tags":["标签1","标签2","标签3"]}${avoidList}`,
      { system: '你是AI技术观察者。只输出JSON，不要markdown代码块。每天推送不同方向的技术动态，避免重复。', maxTokens: 500 }
    );

    const cleaned = aiResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.title) return;

    const { error } = await serviceClient
      .from('daily_tech_cache')
      .update({
        title: parsed.title,
        summary: parsed.summary,
        explanation: parsed.explanation,
        impact: parsed.impact,
        tags: parsed.tags,
      })
      .eq('date', date);

    if (error) {
      console.error('Failed to update daily_tech_cache:', error);
    }
  } catch (err) {
    console.error('generateAndUpgradeTech error:', err);
  }
}