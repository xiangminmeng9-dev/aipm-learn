'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'review' | 'all' | 'generate'>('review');
  const [generateTopic, setGenerateTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [reviewedCount, setReviewedCount] = useState(0);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/daily-challenge/flashcards?mode=due');
      if (res.ok) {
        const data = await res.json();
        setDueCards(data.cards || []);
      }
      const res2 = await fetch('/api/daily-challenge/flashcards?mode=all');
      if (res2.ok) {
        const data = await res2.json();
        setCards(data.cards || []);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleRate = async (rating: number) => {
    const card = dueCards[currentIndex];
    if (!card) return;

    try {
      await fetch('/api/daily-challenge/flashcards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, rating }),
      });
    } catch { /* ignore */ }

    setReviewedCount(prev => prev + 1);
    setIsFlipped(false);

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setMode('all');
    }
  };

  const handleGenerate = async () => {
    if (!generateTopic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/daily-challenge/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generate: true, topic: generateTopic.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.generated) {
          setGenerateTopic('');
          await fetchCards();
          setMode('all');
        }
      } else {
        const data = await res.json();
        alert(data.error || '生成失败');
      }
    } catch {
      alert('生成失败，请重试');
    } finally { setIsGenerating(false); }
  };

  const handleManualCreate = async () => {
    if (!manualFront.trim() || !manualBack.trim()) return;
    try {
      const res = await fetch('/api/daily-challenge/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ front: manualFront, back: manualBack, category: manualCategory || 'general' }),
      });
      if (res.ok) {
        setManualFront('');
        setManualBack('');
        setManualCategory('');
        await fetchCards();
      }
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/daily-challenge" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              返回
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-bold text-gray-900">知识闪卡</h1>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'review', label: '复习', count: dueCards.length },
              { key: 'all', label: '全部', count: cards.length },
              { key: 'generate', label: '生成', count: null },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key as typeof mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === tab.key ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}{tab.count !== null ? ` (${tab.count})` : ''}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {mode === 'review' && (
          <>
            {dueCards.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                <div className="mb-3 text-4xl">🎉</div>
                <h3 className="text-base font-semibold text-gray-800">暂无待复习卡片</h3>
                <p className="mt-1 text-sm text-gray-500">所有卡片都已复习完毕，或还没有创建卡片</p>
                <button
                  onClick={() => setMode('generate')}
                  className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  AI 生成闪卡
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 text-center text-xs text-gray-400">
                  {currentIndex + 1} / {dueCards.length} {reviewedCount > 0 && `· 已复习 ${reviewedCount} 张`}
                </div>

                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="group cursor-pointer"
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className="relative w-full transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      minHeight: '280px',
                    }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-8 shadow-sm"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <div className="mb-3 text-xs font-medium text-indigo-500">问题</div>
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">{currentCard.front}</p>
                      <p className="mt-6 text-xs text-gray-400">点击翻转查看答案</p>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="mb-3 text-xs font-medium text-emerald-600">答案</div>
                      <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{currentCard.back}</p>
                    </div>
                  </div>
                </div>

                {isFlipped && (
                  <div className="mt-6">
                    <p className="mb-3 text-center text-xs text-gray-500">你掌握了吗？</p>
                    <div className="flex justify-center gap-2">
                      {[
                        { rating: 1, label: '完全不会', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                        { rating: 2, label: '有印象', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                        { rating: 3, label: '基本掌握', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                        { rating: 4, label: '熟练掌握', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                        { rating: 5, label: '完全掌握', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                      ].map(btn => (
                        <button
                          key={btn.rating}
                          onClick={() => handleRate(btn.rating)}
                          className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${btn.color}`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {mode === 'all' && (
          <div className="space-y-3">
            {cards.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                <p className="text-sm text-gray-500">还没有闪卡，去 AI 生成一些吧</p>
                <button
                  onClick={() => setMode('generate')}
                  className="mt-3 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  AI 生成
                </button>
              </div>
            ) : (
              cards.map(card => (
                <div key={card.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{card.front}</p>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{card.back}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">{card.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {mode === 'generate' && (
          <div className="space-y-6">
            {/* AI Generate */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-6">
              <h3 className="text-base font-semibold text-gray-900">AI 智能生成</h3>
              <p className="mt-1 text-xs text-gray-500">输入主题，AI 自动生成 8 张知识闪卡</p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  placeholder="例如：AI 推荐系统、NLP 基础、A/B 测试..."
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !generateTopic.trim()}
                  className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGenerating ? '生成中...' : '生成'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {['AI 推荐系统', 'NLP 基础概念', 'A/B 测试方法', 'Prompt Engineering', 'AI 评估指标', '用户增长策略'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setGenerateTopic(tag)}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Create */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold text-gray-900">手动创建</h3>
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  value={manualFront}
                  onChange={(e) => setManualFront(e.target.value)}
                  placeholder="正面（问题/概念）"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none"
                />
                <textarea
                  value={manualBack}
                  onChange={(e) => setManualBack(e.target.value)}
                  placeholder="背面（答案/解释）"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none"
                  rows={3}
                />
                <input
                  type="text"
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  placeholder="分类（可选）"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none"
                />
                <button
                  onClick={handleManualCreate}
                  disabled={!manualFront.trim() || !manualBack.trim()}
                  className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                >
                  创建卡片
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
