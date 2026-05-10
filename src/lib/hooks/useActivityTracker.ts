'use client';

import { useEffect, useRef, useCallback } from 'react';

const BATCH_INTERVAL = 30_000;
const VALID_MODULES = ['interview', 'coding', 'skills', 'simulator', 'notebook', 'resume', 'resources', 'daily-challenge'];

export function useActivityTracker(module: string) {
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(true);

  const sendLog = useCallback(async (durationSeconds: number) => {
    if (durationSeconds < 1 || !VALID_MODULES.includes(module)) return;
    try {
      await fetch('/api/activity/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, action: 'page_view', duration_seconds: Math.round(durationSeconds) }),
      });
    } catch {}
  }, [module]);

  const flush = useCallback(() => {
    const now = Date.now();
    const elapsed = visibleRef.current ? (now - startTimeRef.current) / 1000 : 0;
    const total = accumulatedRef.current + elapsed;
    if (total >= 1) {
      const payload = JSON.stringify({ module, action: 'page_view', duration_seconds: Math.round(total) });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/activity/log', new Blob([payload], { type: 'application/json' }));
      } else {
        sendLog(total);
      }
    }
    accumulatedRef.current = 0;
    startTimeRef.current = now;
  }, [module, sendLog]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    accumulatedRef.current = 0;

    const onVisible = () => {
      visibleRef.current = true;
      startTimeRef.current = Date.now();
    };
    const onHidden = () => {
      visibleRef.current = false;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      accumulatedRef.current += elapsed;
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) onHidden(); else onVisible();
    });

    timerRef.current = setInterval(() => {
      if (visibleRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        startTimeRef.current = Date.now();
        accumulatedRef.current += elapsed;
      }
      if (accumulatedRef.current >= 1) {
        sendLog(accumulatedRef.current);
        accumulatedRef.current = 0;
      }
    }, BATCH_INTERVAL);

    const onUnload = () => flush();
    window.addEventListener('beforeunload', onUnload);

    return () => {
      flush();
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', () => {});
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [module, sendLog, flush]);
}

export async function logAiCall(module: string, inputTokens?: number, outputTokens?: number) {
  try {
    await fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module,
        action: 'ai_call',
        input_tokens: inputTokens || 0,
        output_tokens: outputTokens || 0,
      }),
    });
  } catch {}
}
