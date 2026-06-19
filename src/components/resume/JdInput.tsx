'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api/fetch';

interface JdInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Bookmarklet 代码：在招聘网站页面点击后提取 JD 内容并复制到剪贴板
 * 然后打开应用页面，用户只需粘贴即可
 */
const BOOKMARKLET_JS = `javascript:void((function(){var s=document.querySelector('.job-detail-section')||document.querySelector('.job-sec-text')||document.querySelector('.job-box')||document.querySelector('.job-desc');if(!s){alert('未找到JD内容，请确保在岗位详情页');return}var t=s.innerText.trim();if(!t){alert('JD内容为空');return}navigator.clipboard.writeText(t).then(function(){alert('✅ JD已复制到剪贴板！共'+t.length+'字\\n请切换到应用页面粘贴')}).catch(function(){var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);alert('✅ JD已复制到剪贴板！共'+t.length+'字\\n请切换到应用页面粘贴')})})())`;

export default function JdInput({ value, onChange }: JdInputProps) {
  const [jdUrl, setJdUrl] = useState('');
  const [urlFetching, setUrlFetching] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showBookmarklet, setShowBookmarklet] = useState(false);

  const handleFetchUrl = async () => {
    if (!jdUrl.trim() || urlFetching) return;
    setUrlFetching(true);
    setUrlError(null);
    setShowBookmarklet(false);
    try {
      const res = await apiFetch('/api/jd/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.error || '链接提取失败');
        if (data.fallback === 'bookmarklet') {
          setShowBookmarklet(true);
        }
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
      {/* URL 输入框 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">从招聘网站提取 JD</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
            placeholder="粘贴BOSS直聘、拉勾等岗位链接..."
            className="flex-1 rounded-xl border-2 border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={handleFetchUrl}
            disabled={urlFetching || !jdUrl.trim()}
            className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {urlFetching ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                提取中...
              </span>
            ) : '提取'}
          </button>
        </div>
        {urlFetching && (
          <p className="mt-1.5 text-xs text-muted-foreground">正在通过智能提取服务获取JD内容（可能需要10-30秒）...</p>
        )}
        {urlError && !showBookmarklet && (
          <p className="mt-1.5 text-xs text-red-500">{urlError}</p>
        )}
      </div>

      {/* Bookmarklet fallback */}
      {showBookmarklet && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-foreground">自动提取失败，请使用书签小工具：</p>
          <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
            <li>将下方按钮<strong>拖拽到浏览器书签栏</strong></li>
            <li>在BOSS直聘岗位详情页<strong>点击该书签</strong></li>
            <li>JD内容会自动复制到剪贴板，回到这里粘贴即可</li>
          </ol>
          <div className="mt-3">
            <a
              href={BOOKMARKLET_JS}
              onClick={(e) => {
                e.preventDefault();
                // 点击时提示拖拽
                alert('请将此按钮拖拽到书签栏使用 👆\n\n不要直接点击，在岗位详情页点击书签即可提取JD');
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 cursor-grab transition-colors"
              title="拖拽到书签栏，在岗位详情页点击即可提取JD"
            >
              📎 提取JD
            </a>
            <span className="ml-2 text-xs text-muted-foreground">← 拖拽到书签栏</span>
          </div>
          {urlError && (
            <p className="mt-2 text-xs text-muted-foreground">原因：{urlError}</p>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="mx-3 shrink-0 text-xs text-muted-foreground">或手动粘贴</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="粘贴职位描述（JD）获得更精准匹配...（可选）"
        className="app-input w-full min-h-[200px] resize-none p-4 text-sm"
      />
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">{value.length} 字符</span>
      </div>
    </div>
  );
}
