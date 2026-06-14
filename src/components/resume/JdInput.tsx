'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api/fetch';

interface JdInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function JdInput({ value, onChange }: JdInputProps) {
  const [jdUrl, setJdUrl] = useState('');
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFetchJdUrl = async () => {
    if (!jdUrl.trim() || urlFetching) return;
    setUrlFetching(true);
    setUrlError(null);
    try {
      const res = await apiFetch('/api/jd/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.error || '链接提取失败');
      } else if (data.text) {
        onChange(data.text);
        setJdUrl('');
      }
    } catch {
      setUrlError('网络错误，请重试');
    } finally {
      setUrlFetching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* URL 输入区域 */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">从招聘链接提取（BOSS直聘等）</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFetchJdUrl(); }}
            placeholder="粘贴招聘链接，如 https://www.zhipin.com/job_detail/..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={handleFetchJdUrl}
            disabled={urlFetching || !jdUrl.trim()}
            className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {urlFetching ? '提取中...' : '提取'}
          </button>
        </div>
        {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="mx-3 shrink-0 text-xs text-muted-foreground">或手动粘贴</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* 手动粘贴区域 */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="粘贴职位描述（JD）获得更精准匹配，不填则仅基于公司画像优化...（可选）"
        className="app-input w-full min-h-[200px] resize-none p-4 text-sm"
      />
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">{value.length} 字符</span>
      </div>
    </div>
  );
}
