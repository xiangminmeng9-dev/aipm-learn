'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api/fetch';
import SkillEditor from '@/components/skills/SkillEditor';

type DraftLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; content: string }
  | { status: 'error'; message: string };

interface WritePageContentProps {
  draftId: string | null;
}

export default function WritePageContent({ draftId }: WritePageContentProps) {
  const [state, setState] = useState<DraftLoadState>(draftId ? { status: 'loading' } : { status: 'idle' });
  const fetchInitiated = useRef(false);

  useEffect(() => {
    if (!draftId || fetchInitiated.current) return;
    fetchInitiated.current = true;

    apiFetch(`/api/skills/workshop/drafts/${draftId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`加载草稿失败: HTTP ${res.status}`);
        const data = await res.json();
        setState({ status: 'loaded', content: data.content ?? '' });
      })
      .catch((err) => {
        setState({ status: 'error', message: err instanceof Error ? err.message : '加载草稿失败' });
      });
  }, [draftId]);

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-muted-foreground">加载草稿中...</div>
      </div>
    );
  }

  if (state.status === 'error' && draftId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <p className="text-sm text-red-500">{state.message}</p>
        <button
          type="button"
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          onClick={() => (window.location.href = '/skills/workshop/write')}
        >
          创建新技能
        </button>
      </div>
    );
  }

  return (
    <SkillEditor
      draftId={draftId || undefined}
      initialContent={state.status === 'loaded' ? state.content : undefined}
    />
  );
}
