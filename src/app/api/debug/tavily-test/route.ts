import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TAVILY_API_KEY not set' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: '今天金价',
        max_results: 2,
        topic: 'news',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ error: `Tavily API ${response.status}` });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      result_count: (data.results || []).length,
      results: (data.results || []).map((r: { title?: string; url?: string }) => ({
        title: r.title,
        url: r.url,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg });
  }
}
