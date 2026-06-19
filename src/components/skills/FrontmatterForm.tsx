'use client';

import { useState, useCallback } from 'react';
import YAML from 'yaml';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  type FrontmatterData,
  NAME_REGEX,
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '@/types/workshop';

// Re-export for backward compatibility
export type { FrontmatterData } from '@/types/workshop';
export { NAME_REGEX, NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from '@/types/workshop';

interface FrontmatterFormProps {
  value: FrontmatterData;
  onChange: (data: FrontmatterData) => void;
}

export default function FrontmatterForm({ value, onChange }: FrontmatterFormProps) {
  const [showOptional, setShowOptional] = useState(false);

  const updateField = useCallback(
    <K extends keyof FrontmatterData>(key: K, val: FrontmatterData[K]) => {
      onChange({ ...value, [key]: val });
    },
    [value, onChange]
  );

  const updateMetadata = useCallback(
    <K extends keyof NonNullable<FrontmatterData['metadata']>>(key: K, val: string) => {
      const metadata = { ...value.metadata, [key]: val || undefined };
      // Clean up empty metadata
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(metadata)) {
        if (v) cleaned[k] = v;
      }
      onChange({
        ...value,
        metadata:
          Object.keys(cleaned).length > 0 ? (cleaned as FrontmatterData['metadata']) : undefined,
      });
    },
    [value, onChange]
  );

  const nameValid =
    !value.name || (NAME_REGEX.test(value.name) && value.name.length <= NAME_MAX_LENGTH);
  const descValid =
    !value.description ||
    (value.description.length > 0 && value.description.length <= DESCRIPTION_MAX_LENGTH);

  return (
    <div className="space-y-4">
      {/* Required fields */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            name <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            placeholder="my-skill-name (小写字母+数字+连字符)"
            value={value.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={cn(
              'h-9 text-sm font-mono',
              !nameValid && 'border-red-500 focus-visible:ring-red-500'
            )}
            maxLength={NAME_MAX_LENGTH}
          />
          <div className="mt-1 flex items-center justify-between">
            {!nameValid && (
              <span className="text-xs text-red-500">
                仅允许小写字母、数字和连字符，且以字母或数字开头
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {value.name.length}/{NAME_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            description <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="描述技能的功能和使用场景..."
            value={value.description}
            onChange={(e) => updateField('description', e.target.value)}
            className={cn(
              'min-h-[80px] text-sm',
              !descValid && 'border-red-500 focus-visible:ring-red-500'
            )}
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
          <div className="mt-1 flex items-center justify-between">
            {!descValid && (
              <span className="text-xs text-red-500">描述长度需在 1-1024 字符之间</span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {value.description.length}/{DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
        </div>
      </div>

      {/* Optional fields toggle */}
      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {showOptional ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        可选字段
      </button>

      {showOptional && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                metadata.author
              </label>
              <Input
                type="text"
                placeholder="作者名"
                value={value.metadata?.author || ''}
                onChange={(e) => updateMetadata('author', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                metadata.version
              </label>
              <Input
                type="text"
                placeholder="1.0"
                value={value.metadata?.version || ''}
                onChange={(e) => updateMetadata('version', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                metadata.category
              </label>
              <Input
                type="text"
                placeholder="如: workflow, product-management"
                value={value.metadata?.category || ''}
                onChange={(e) => updateMetadata('category', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                metadata.role
              </label>
              <Input
                type="text"
                placeholder="如: product-manager"
                value={value.metadata?.role || ''}
                onChange={(e) => updateMetadata('role', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              allowed-tools
            </label>
            <Input
              type="text"
              placeholder="Read Write Edit Bash WebFetch (空格分隔)"
              value={value['allowed-tools'] || ''}
              onChange={(e) => updateField('allowed-tools', e.target.value || undefined)}
              className="h-9 text-sm font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">effort</label>
            <select
              value={value.effort || ''}
              onChange={(e) =>
                updateField('effort', (e.target.value as 'low' | 'medium' | 'high') || undefined)
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">未设置</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Build a YAML frontmatter string from FrontmatterData.
 * Omits undefined/empty optional fields.
 */
export function buildFrontmatterString(data: FrontmatterData): string {
  const obj: Record<string, unknown> = {
    name: data.name,
    description: data.description,
  };

  if (data.metadata && Object.keys(data.metadata).length > 0) {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.metadata)) {
      if (v) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length > 0) {
      obj.metadata = cleaned;
    }
  }

  if (data['allowed-tools']) {
    obj['allowed-tools'] = data['allowed-tools'];
  }

  if (data.effort) {
    obj.effort = data.effort;
  }

  const yamlStr = YAML.stringify(obj, { lineWidth: 0 }).trim();
  return `---\n${yamlStr}\n---`;
}

/**
 * Parse frontmatter from a full SKILL.md content string.
 * Returns { frontmatter, body } or null if parsing fails.
 */
export function parseFrontmatter(
  content: string
): { frontmatter: FrontmatterData; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  try {
    const parsed = YAML.parse(match[1]) as Record<string, unknown>;
    return {
      frontmatter: {
        name: String(parsed.name || ''),
        description: String(parsed.description || ''),
        metadata: parsed.metadata as FrontmatterData['metadata'] | undefined,
        'allowed-tools': parsed['allowed-tools'] ? String(parsed['allowed-tools']) : undefined,
        effort: parsed.effort as FrontmatterData['effort'] | undefined,
      },
      body: match[2] || '',
    };
  } catch {
    return null;
  }
}
