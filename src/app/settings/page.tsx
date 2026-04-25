'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Protocol = 'anthropic' | 'openai';

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
      const res = await fetch('/api/settings/ai-config');
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
      const res = await fetch('/api/settings/ai-config', {
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
      const res = await fetch('/api/settings/ai-config', { method: 'DELETE' });
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="flex items-center gap-4 px-8 py-4 md:px-12">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            返回首页
          </Link>
          <span className="text-gray-300">|</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900">设置</h1>
            <p className="text-xs text-gray-500">自定义你使用的 AI 模型</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900">AI 模型配置</h2>
            <p className="mt-1 text-xs text-gray-500">
              {hasConfig
                ? '当前平台 AI 功能将使用你的自定义模型。'
                : '平台默认使用系统内置模型。可在下方配置你自己的模型，支持 Anthropic / OpenAI 兼容协议。'}
            </p>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium text-gray-600">快速填入（可选）</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">协议</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProtocol('anthropic')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    protocol === 'anthropic'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Anthropic Messages</div>
                  <div className="mt-0.5 text-xs text-gray-500">Claude / Anthropic 兼容</div>
                </button>
                <button
                  onClick={() => setProtocol('openai')}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm transition-colors ${
                    protocol === 'openai'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">OpenAI Chat Completions</div>
                  <div className="mt-0.5 text-xs text-gray-500">GPT / DeepSeek / Kimi / Qwen 等</div>
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Base URL</label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={protocol === 'anthropic' ? 'https://api.anthropic.com（留空走官方默认）' : 'https://api.openai.com/v1'}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-gray-400">OpenAI 协议请填写到 `/v1` 级别</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-20 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">模型 ID</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={protocol === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o'}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {message && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
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
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
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

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-xs text-amber-800">
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
