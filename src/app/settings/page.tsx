'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Protocol = 'anthropic' | 'openai';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import LearningReminderSettings from '@/components/reminder/LearningReminderSettings';
import { apiFetch } from '@/lib/api/fetch';

export default function SettingsPage() {
  const [protocol, setProtocol] = useState<Protocol>('anthropic');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasConfig, setHasConfig] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await apiFetch('/api/settings/ai-config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setProtocol(data.config.protocol);
          setBaseUrl(data.config.base_url || '');
          setApiKey(data.config.api_key || '');
          setModel(data.config.model || '');
          setHasConfig(true);
        }
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/settings/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol, base_url: baseUrl.trim(), api_key: apiKey.trim(), model: model.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: '配置已保存，下一次 AI 请求开始生效' });
        setHasConfig(true);
      } else {
        setMessage({ type: 'error', text: data.error || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally { setIsSaving(false); }
  };

  const handleReset = async () => {
    if (!confirm('确定恢复为系统默认模型？你自定义的配置将被删除。')) return;
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/settings/ai-config', { method: 'DELETE' });
      if (res.ok) {
        setProtocol('anthropic');
        setBaseUrl('');
        setApiKey('');
        setModel('');
        setHasConfig(false);
        setMessage({ type: 'success', text: '已恢复为系统默认模型' });
      }
    } catch { /* ignore */ } finally { setIsSaving(false); }
  };

  const presets = [
    {
      name: 'Anthropic 官方 (Claude)',
      protocol: 'anthropic' as Protocol,
      base_url: '',
      model: 'claude-sonnet-4-5',
    },
    {
      name: 'OpenAI 官方',
      protocol: 'openai' as Protocol,
      base_url: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    },
    {
      name: 'DeepSeek',
      protocol: 'openai' as Protocol,
      base_url: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
    },
    {
      name: '月之暗面 Kimi',
      protocol: 'openai' as Protocol,
      base_url: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k',
    },
    {
      name: '通义千问',
      protocol: 'openai' as Protocol,
      base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
    },
    {
      name: '智谱 GLM',
      protocol: 'openai' as Protocol,
      base_url: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4-plus',
    },
  ];

  const applyPreset = (p: typeof presets[number]) => {
    setProtocol(p.protocol);
    setBaseUrl(p.base_url);
    setModel(p.model);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-4 px-8 py-4 md:px-12">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            返回首页
          </Link>
          <span className="text-muted-foreground">|</span>
          <div>
            <h1 className="text-lg font-bold text-foreground">设置</h1>
            <p className="text-xs font-medium text-muted-foreground">自定义你使用的 AI 模型</p>
          </div>
        </div>
      </header>

      <div className="px-8 py-8">
        {/* 学习数据看板 */}
        <div className="mb-6 rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">学习数据看板</h2>
              <p className="mt-1 text-xs font-medium text-muted-foreground">学习时长、面试次数、技能覆盖度、进步曲线</p>
            </div>
            <Link
              href="/settings/dashboard"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              查看看板
            </Link>
          </div>
        </div>

        {/* 学习提醒 */}
        <div className="mb-6 rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <LearningReminderSettings />
        </div>

        {/* 外观设置 */}
        <div className="mb-6 rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">外观设置</h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">选择浅色、深色或跟随系统偏好</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground">AI 模型配置</h2>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {hasConfig
                ? '当前平台 AI 功能将使用你的自定义模型。'
                : '平台默认使用系统内置模型。可在下方配置你自己的模型，支持 Anthropic / OpenAI 兼容协议。'}
            </p>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">快速填入（可选）</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border-2 border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">协议</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProtocol('anthropic')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    protocol === 'anthropic'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-border bg-card text-muted-foreground hover:border-border'
                  }`}
                >
                  <div className="font-semibold">Anthropic Messages</div>
                  <div className="mt-0.5 text-xs font-medium text-muted-foreground">Claude / Anthropic 兼容</div>
                </button>
                <button
                  onClick={() => setProtocol('openai')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    protocol === 'openai'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-border bg-card text-muted-foreground hover:border-border'
                  }`}
                >
                  <div className="font-semibold">OpenAI Chat Completions</div>
                  <div className="mt-0.5 text-xs font-medium text-muted-foreground">GPT / DeepSeek / Kimi / Qwen 等</div>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Base URL</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={protocol === 'anthropic' ? 'https://api.anthropic.com（留空走官方默认）' : 'https://api.openai.com/v1'}
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <p className="mt-1 text-xs font-medium text-muted-foreground">OpenAI 协议请填写到 `/v1` 级别</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 pr-20 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-muted-foreground"
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">模型 ID</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={protocol === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o'}
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {message && (
            <div className={`mt-4 rounded-xl border-2 px-4 py-3 text-sm font-medium ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={handleReset}
              disabled={isSaving || !hasConfig}
              className="rounded-xl border-2 border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
            >
              恢复默认
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim() || !model.trim()}
              className="rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-5 text-xs font-medium text-amber-800">
          <p className="font-semibold">💡 使用说明</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>保存后所有 AI 功能（面试助手、模拟工作流、简历优化等）会使用你配置的模型</li>
            <li>不配置时使用平台内置默认模型</li>
            <li>API Key 仅存储在你自己的账号下，其他用户不可见</li>
            <li>OpenAI 协议需填写到 v1 级别的 Base URL，Anthropic 协议留空即默认走官方</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
