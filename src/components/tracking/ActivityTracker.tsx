'use client';

import { useActivityTracker } from '@/lib/hooks/useActivityTracker';

export default function ActivityTracker({ module }: { module: string }) {
  useActivityTracker(module);
  return null;
}
