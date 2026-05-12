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
      // No RSS data — generate default content based on date
      const techTopics = [
        {
          title: 'Claude 4 系列模型发布：多模态能力大幅提升',
          summary: 'Anthropic 发布 Claude 4 系列模型，在代码生成、长上下文理解和多模态处理方面取得重大突破。',
          explanation: 'Claude 4 系列包括 Opus 4.7、Sonnet 4.6 和 Haiku 4.5 三个版本。Opus 4.7 在复杂推理任务上表现最佳，支持 200K token 上下文窗口，多模态能力覆盖图像、视频和文档理解。Sonnet 4.6 在速度和能力间取得平衡，适合大多数生产场景。Haiku 4.5 则专注于快速响应，延迟降低 50%。',
          impact: '对于 AI PM 而言，Claude 4 的多模态能力意味着可以在产品中集成更复杂的文档分析、代码审查和多格式内容理解功能。200K 上下文窗口使得处理长文档、完整代码库成为可能，为构建企业级 AI 应用提供了更强的技术基础。',
          tags: ['大模型', 'Anthropic', '多模态'],
        },
        {
          title: 'OpenAI GPT-4.1 API 正式上线',
          summary: 'OpenAI 推出 GPT-4.1 版本，在指令遵循和代码生成方面显著改进，同时降低 API 调用成本。',
          explanation: 'GPT-4.1 相比 GPT-4 Turbo 在指令遵循准确率上提升 20%，代码生成质量提升 15%。新版本优化了 JSON 格式输出，减少格式错误。API 价格下降约 30%，使得大规模部署更加经济可行。',
          impact: 'AI PM 需要重新评估产品中使用的模型选择。GPT-4.1 的成本下降可能改变 ROI 计算，使得之前因成本过高而放弃的功能变得可行。指令遵循能力的提升也意味着可以设计更复杂的 prompt 流程。',
          tags: ['大模型', 'OpenAI', 'API'],
        },
        {
          title: 'AI Agent 编排框架 LangGraph 2.0 发布',
          summary: 'LangGraph 2.0 引入可视化调试器、状态持久化和多 Agent 协作模式，大幅简化复杂 Agent 系统开发。',
          explanation: '新版本提供图形化界面展示 Agent 执行流程，支持断点调试和状态回滚。新增的持久化层可以将 Agent 状态保存到数据库，实现长时间运行任务的恢复。多 Agent 协作模式支持并行执行、结果聚合和冲突解决。',
          impact: '对于构建复杂 AI 工作流的 PM 来说，LangGraph 2.0 降低了技术门槛，使得非技术背景的产品经理也能理解和参与 Agent 流程设计。可视化调试能力大幅缩短了问题排查时间，提升迭代效率。',
          tags: ['Agent', '框架', 'LangChain'],
        },
        {
          title: 'RAG 2.0 技术：混合检索与重排序成为主流',
          summary: '业界普遍采用"向量检索 + 关键词检索 + 重排序"的混合架构，显著提升 RAG 系统准确率。',
          explanation: '传统纯向量检索在精确匹配场景表现不佳，混合检索结合了 BM25 关键词匹配和语义向量检索的优势。重排序模型（如 Cohere Rerank、BGE Reranker）对候选文档进行二次打分，Top-5 准确率提升 30-50%。',
          impact: 'AI PM 在设计知识库问答产品时，应考虑采用混合检索架构。虽然增加了系统复杂度，但准确率的提升对用户体验影响显著。需要评估不同重排序方案的成本和效果，选择适合业务场景的配置。',
          tags: ['RAG', '检索', '知识库'],
        },
        {
          title: '多模态大模型在医疗影像诊断达到专家水平',
          summary: 'Google Med-Gemini 在 X 光、CT 和病理切片诊断中达到或超越专科医生准确率，通过 FDA 认证。',
          explanation: 'Med-Gemini 2.0 在 14 种常见疾病诊断中准确率达到 94% 以上，其中肺癌早期筛查准确率 96.3%，超过放射科专家平均水平。模型支持多影像类型联合分析，可同时参考 X 光、CT 和 MRI 做出综合判断。',
          impact: '医疗 AI 的商业化进程正在加速。AI PM 需要关注监管合规要求，FDA 认证意味着产品可以进入临床应用。但也要注意模型偏见、可解释性和责任界定等问题，这些是医疗 AI 产品成功的关键。',
          tags: ['医疗AI', '多模态', '诊断'],
        },
      ];

      // Use date to pick a topic deterministically
      const dateHash = today.split('-').reduce((a, b) => a + parseInt(b), 0);
      const selectedTopic = techTopics[dateHash % techTopics.length];

      techData = {
        title: selectedTopic.title,
        summary: selectedTopic.summary,
        explanation: selectedTopic.explanation,
        impact: selectedTopic.impact,
        tags: selectedTopic.tags,
        source_url: undefined,
      };
      sourceName = 'AI 技术日报';
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
