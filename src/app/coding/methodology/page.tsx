'use client';

import { useState, useEffect } from 'react';
import CodingMethodologyCard from '@/components/coding/CodingMethodologyCard';
import type { CodingMethodology } from '@/types';

export default function CodingMethodologyPage() {
  const [methodology, setMethodology] = useState<CodingMethodology | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/coding/methodology')
      .then((r) => r.json())
      .then((data) => {
        setMethodology(data.methodology ?? null);
        setMessage(data.message ?? '');
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">方法论提炼</h1>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : methodology ? (
        <CodingMethodologyCard methodology={methodology} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">{message || '还没有方法论'}</p>
          <p className="mt-1 text-sm text-muted-foreground">多进行开发流程练习，系统会自动提炼方法论</p>
        </div>
      )}
    </div>
  );
}
