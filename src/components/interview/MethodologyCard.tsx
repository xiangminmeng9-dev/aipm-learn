'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Markdown from '@/components/ui/markdown';

interface MethodologyCardProps {
  type: { id: string; name: string };
  framework: string;
  keySteps: string[];
  typicalCases: string[];
  sourceCount: number;
  updatedAt: string;
  isExpanded: boolean;
  onToggle: () => void;
  highFrequencyQuestions?: { id: string; text: string }[];
}

/**
 * Normalize content for display:
 * - If JSON, convert to readable Markdown
 * - If already Markdown, return as-is
 * - Handles nested JSON strings inside JSON values
 */
function normalizeContent(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  // Try parsing as JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return jsonToReadableMarkdown(parsed);
    } catch {
      // Broken JSON — best-effort cleanup
      return cleanupBrokenJson(trimmed);
    }
  }

  // Check if the text itself contains embedded JSON (e.g. a string value that is JSON)
  // This happens when AI puts JSON inside a Markdown string
  const jsonInText = trimmed.match(/\{[\s\S]*\}/);
  if (jsonInText && jsonInText.index !== undefined && jsonInText.index > 0) {
    // There's prose before the JSON — keep the prose, try to convert the JSON part
    const before = trimmed.slice(0, jsonInText.index).trim();
    try {
      const parsed = JSON.parse(jsonInText[0]);
      return before + '\n\n' + jsonToReadableMarkdown(parsed);
    } catch {
      // Can't parse, return as-is
    }
  }

  return trimmed;
}

/** Convert JSON to human-readable Markdown */
function jsonToReadableMarkdown(obj: unknown, depth = 0): string {
  if (typeof obj === 'string') {
    // A string value might itself be JSON
    const s = obj.trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const inner = JSON.parse(s);
        return jsonToReadableMarkdown(inner, depth + 1);
      } catch {
        // Not valid JSON, return as-is
      }
    }
    return obj;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (obj === null || obj === undefined) return '';

  if (Array.isArray(obj)) {
    return obj
      .map((item) => {
        if (typeof item === 'string') return `- ${item}`;
        if (typeof item === 'number' || typeof item === 'boolean') return `- ${String(item)}`;
        return `- ${jsonToReadableMarkdown(item, depth + 1)}`;
      })
      .join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    return entries
      .map(([key, value]) => {
        const label = humanizeKey(key);
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `**${label}**：${value}`;
        if (typeof value === 'number' || typeof value === 'boolean') return `**${label}**：${String(value)}`;
        if (Array.isArray(value)) {
          if (value.length === 0) return '';
          if (value.every((v) => typeof v === 'string')) {
            return `**${label}**：\n${value.map((v) => `  - ${v}`).join('\n')}`;
          }
          return `**${label}**：\n${value.map((v) => `  - ${jsonToReadableMarkdown(v, depth + 1)}`).join('\n')}`;
        }
        if (typeof value === 'object') {
          return `**${label}**：\n${jsonToReadableMarkdown(value, depth + 1)}`;
        }
        return `**${label}**：${String(value)}`;
      })
      .filter(Boolean)
      .join('\n\n');
  }

  return String(obj);
}

/** Convert snake_case/camelCase keys to readable Chinese-friendly labels */
function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Best-effort cleanup for broken JSON strings */
function cleanupBrokenJson(text: string): string {
  return text
    .replace(/^\{|\}$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/"([^"]+)"\s*:\s*/g, '**$1**：')
    .replace(/^\s*[\[{]/gm, '')
    .replace(/[\]}]\s*$/gm, '')
    .replace(/,\s*$/gm, '')
    .replace(/\\"/g, '"')
    .trim();
}

export default function MethodologyCard({
  type,
  framework,
  keySteps,
  typicalCases,
  sourceCount,
  updatedAt,
  isExpanded,
  onToggle,
  highFrequencyQuestions,
}: MethodologyCardProps) {
  const normalizedFramework = normalizeContent(framework);

  return (
    <Card className="border-[#E5E7EB] bg-white overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-400 to-violet-400" />
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📘</span>
            <CardTitle className="text-lg text-[#1F2937]">{type.name}</CardTitle>
            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 text-sm">
              {sourceCount} 次练习
            </Badge>
          </div>
          <span className="text-sm text-[#6B7280]">
            {new Date(updatedAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        {!isExpanded && (
          <p className="mt-2 line-clamp-2 text-sm text-[#6B7280] break-words overflow-wrap-anywhere">
            {normalizedFramework}
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5 pt-0">
          {/* 核心框架 */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 overflow-hidden">
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-indigo-700">
              <span>🏗️</span>核心框架
            </h4>
            <div className="text-sm text-[#4B5563] break-words overflow-wrap-anywhere hyphens-auto">
              <Markdown content={normalizedFramework} />
            </div>
          </div>

          {/* 关键步骤 */}
          {keySteps.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 overflow-hidden">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                <span>📋</span>关键步骤
              </h4>
              <ol className="space-y-2">
                {keySteps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[#4B5563] break-words overflow-wrap-anywhere">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">{i + 1}</span>
                    <span className="min-w-0 break-words overflow-wrap-anywhere">{normalizeContent(step)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 典型案例 */}
          {typicalCases.length > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 overflow-hidden">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <span>💡</span>典型案例
              </h4>
              <div className="space-y-2">
                {typicalCases.map((c, i) => (
                  <div key={i} className="flex gap-2 text-sm text-[#4B5563] break-words overflow-wrap-anywhere">
                    <span className="mt-0.5 flex-shrink-0 text-emerald-500">•</span>
                    <span className="min-w-0 break-words overflow-wrap-anywhere">{normalizeContent(c)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 高频问题 */}
          {highFrequencyQuestions && highFrequencyQuestions.length > 0 && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/30 p-4 overflow-hidden">
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-sky-700">
                <span>❓</span>高频问题
              </h4>
              <div className="flex flex-wrap gap-2">
                {highFrequencyQuestions.map((q) => (
                  <Badge key={q.id} variant="secondary" className="bg-white text-sky-600 border border-sky-200 text-xs max-w-[200px] truncate">
                    {q.text}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
