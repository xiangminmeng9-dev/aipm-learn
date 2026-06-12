'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KnowledgeGraphProps {
  modules: { id: string; name: string; level: number; level_name: string; is_custom?: boolean; progress_percentage: number; prerequisites?: string[] }[];
  onNodeClick?: (href: string) => void;
}

export default function KnowledgeGraph({ modules, onNodeClick }: KnowledgeGraphProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReadyRef = useRef(false);

  // Send modules data to iframe whenever modules change and iframe is loaded
  const sendDataToIframe = useCallback(() => {
    if (iframeRef.current?.contentWindow && modules.length > 0) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'init', modules },
        '*',
      );
    }
  }, [modules]);

  const handleIframeLoad = useCallback(() => {
    iframeReadyRef.current = true;
    sendDataToIframe();
  }, [sendDataToIframe]);

  // When modules update, send to iframe if it's already loaded
  useEffect(() => {
    if (iframeReadyRef.current) {
      sendDataToIframe();
    }
  }, [modules, sendDataToIframe]);

  // Listen for navigation messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && event.data?.href) {
        if (onNodeClick) onNodeClick(event.data.href);
        else router.push(event.data.href);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onNodeClick, router]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-foreground">AI PM 知识图谱</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">3D 星系知识图谱 · 拖拽旋转 · 点击星球进入学习</p>
      </div>
      <iframe
        ref={iframeRef}
        src="/knowledge-graph/index.html"
        onLoad={handleIframeLoad}
        className="w-full border-0"
        style={{ height: 800, background: '#0a0a1a' }}
        title="AI PM 知识图谱"
      />
    </div>
  );
}
