'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import YAML from 'yaml';
import { apiFetch } from '@/lib/api/fetch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, FileCode, LayoutTemplate, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import FrontmatterForm, {
  buildFrontmatterString,
  parseFrontmatter,
} from '@/components/skills/FrontmatterForm';
import SkillTemplatePicker from '@/components/skills/SkillTemplatePicker';
import SkillPreview from '@/components/skills/SkillPreview';
import ValidationReport from '@/components/skills/ValidationReport';
import { SKILL_TEMPLATES } from '@/lib/skills/skill-templates';
import {
  type FrontmatterData,
  type ValidationResult,
  type EditorMode,
  type SkillTemplateKey,
  type WriteAssistResult,
  NAME_REGEX,
  NAME_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from '@/types/workshop';

interface SkillEditorProps {
  initialContent?: string;
  draftId?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

const SIZE_LIMIT = 200 * 1024; // 200KB

const DEFAULT_FRONTMATTER: FrontmatterData = {
  name: '',
  description: '',
};

export default function SkillEditor({
  initialContent,
  draftId,
  onChange,
  onSave,
}: SkillEditorProps) {
  // ── State ────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<EditorMode>('guided');
  const [rawContent, setRawContent] = useState(initialContent || '');
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>(DEFAULT_FRONTMATTER);
  const [bodyContent, setBodyContent] = useState('');
  const [validation, setValidation] = useState<ValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
  });
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiTemplateType, setAiTemplateType] = useState<string>('basic');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<WriteAssistResult | null>(null);
  const [saving, setSaving] = useState(false);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialized = useRef(false);

  // ── Initialize from initialContent ───────────────────────────────────
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    if (initialContent) {
      const parsed = parseFrontmatter(initialContent);
      if (parsed) {
        setFrontmatter(parsed.frontmatter);
        setBodyContent(parsed.body);
      }
      setRawContent(initialContent);
    }
  }, [initialContent]);

  // ── Build full content from guided mode ──────────────────────────────
  const buildFullContent = useCallback((fm: FrontmatterData, body: string): string => {
    return buildFrontmatterString(fm) + '\n' + body;
  }, []);

  // ── Get current full content ─────────────────────────────────────────
  const currentContent =
    mode === 'guided' ? buildFullContent(frontmatter, bodyContent) : rawContent;

  // ── Auto-save (3-second debounce) ────────────────────────────────────
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      onChange?.(currentContent);
    }, 3000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [currentContent, onChange]);

  // ── Client-side validation ───────────────────────────────────────────
  const validateContent = useCallback((content: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      errors.push('缺少 YAML frontmatter（需要 --- 包裹的头部）');
      return { valid: false, errors, warnings };
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = YAML.parse(match[1]) as Record<string, unknown>;
    } catch {
      errors.push('YAML frontmatter 格式错误');
      return { valid: false, errors, warnings };
    }

    // Required fields
    if (!parsed.name) {
      errors.push('缺少必填字段: name');
    } else {
      const name = String(parsed.name);
      if (!NAME_REGEX.test(name)) {
        errors.push('name 格式错误: 仅允许小写字母、数字和连字符，且以字母或数字开头');
      }
      if (name.length > NAME_MAX_LENGTH) {
        errors.push(`name 长度超过 ${NAME_MAX_LENGTH} 字符`);
      }
    }

    if (!parsed.description) {
      errors.push('缺少必填字段: description');
    } else {
      const desc = String(parsed.description);
      if (desc.length > DESCRIPTION_MAX_LENGTH) {
        errors.push(`description 长度超过 ${DESCRIPTION_MAX_LENGTH} 字符`);
      }
    }

    // Warnings
    const body = content.slice(match[0].length).trim();
    if (!body) {
      warnings.push('正文内容为空，建议添加详细指令');
    }

    if (parsed.effort && !['low', 'medium', 'high'].includes(String(parsed.effort))) {
      warnings.push('effort 值应为 low/medium/high');
    }

    if (!parsed['allowed-tools']) {
      warnings.push('建议添加 allowed-tools 字段声明技能可用工具');
    }

    return { valid: errors.length === 0, errors, warnings };
  }, []);

  // ── Run validation on content change ─────────────────────────────────
  useEffect(() => {
    const result = validateContent(currentContent);
    setValidation(result);
  }, [currentContent, validateContent]);

  // ── Mode switch handlers ─────────────────────────────────────────────
  const switchToRaw = useCallback(() => {
    // Sync guided -> raw
    setRawContent(buildFullContent(frontmatter, bodyContent));
    setMode('raw');
  }, [frontmatter, bodyContent, buildFullContent]);

  const switchToGuided = useCallback(() => {
    // Parse raw -> guided
    const parsed = parseFrontmatter(rawContent);
    if (parsed) {
      setFrontmatter(parsed.frontmatter);
      setBodyContent(parsed.body);
    }
    setMode('guided');
  }, [rawContent]);

  // ── Template selection ───────────────────────────────────────────────
  const handleTemplateSelect = useCallback((key: SkillTemplateKey) => {
    const content = SKILL_TEMPLATES[key].content;
    setRawContent(content);
    const parsed = parseFrontmatter(content);
    if (parsed) {
      setFrontmatter(parsed.frontmatter);
      setBodyContent(parsed.body);
    }
    setTemplateDialogOpen(false);
  }, []);

  // ── AI Write Assist ──────────────────────────────────────────────────
  const handleAiAssist = useCallback(async () => {
    if (!aiDescription.trim()) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await apiFetch('/api/skills/workshop/write-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_description: aiDescription.trim(),
          template_type: aiTemplateType,
          existing_content: currentContent || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setAiResult({
        skill_content: data.skill_content,
        explanation: data.explanation,
        tips: data.tips || [],
      });
    } catch (err) {
      setAiResult({
        skill_content: '',
        explanation: err instanceof Error ? err.message : 'AI 辅助编写失败',
        tips: [],
      });
    } finally {
      setAiLoading(false);
    }
  }, [aiDescription, aiTemplateType, currentContent]);

  const handleApplyAiResult = useCallback(() => {
    if (!aiResult?.skill_content) return;
    const content = aiResult.skill_content;
    setRawContent(content);
    const parsed = parseFrontmatter(content);
    if (parsed) {
      setFrontmatter(parsed.frontmatter);
      setBodyContent(parsed.body);
    }
    setAiDialogOpen(false);
    setAiDescription('');
    setAiResult(null);
  }, [aiResult]);

  // ── Save handler ─────────────────────────────────────────────────────
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // Server-side validation
      const validateRes = await apiFetch('/api/skills/workshop/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent }),
      });
      if (validateRes.ok) {
        const validateData = await validateRes.json();
        // Merge server-side validation with client-side
        if (validateData.errors?.length) {
          setValidation((prev) => ({
            ...prev,
            valid: false,
            errors: [...new Set([...prev.errors, ...validateData.errors])],
          }));
        }
        if (validateData.warnings?.length) {
          setValidation((prev) => ({
            ...prev,
            warnings: [...new Set([...prev.warnings, ...validateData.warnings])],
          }));
        }
      }

      // Parse name from frontmatter for the draft
      const match = currentContent.match(/^---\n([\s\S]*?)\n---/);
      let name = '未命名草稿';
      let description = '';
      if (match) {
        try {
          const YAML = await import('yaml');
          const parsed = YAML.parse(match[1]) as Record<string, unknown>;
          name = String(parsed.name || '未命名草稿');
          description = String(parsed.description || '');
        } catch {
          // Use default name
        }
      }

      // Save draft — PUT if we have a draftId, POST otherwise
      if (draftId) {
        const res = await apiFetch(`/api/skills/workshop/drafts/${draftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            content: currentContent,
            validation_status: validation.valid ? 'valid' : 'invalid',
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || '更新草稿失败');
        }
      } else {
        if (onSave) {
          await onSave(currentContent);
        } else {
          const res = await apiFetch('/api/skills/workshop/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, content: currentContent }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || '保存草稿失败');
          }
        }
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }, [currentContent, draftId, validation.valid, onSave]);

  // ── Size indicator ───────────────────────────────────────────────────
  const contentSize = new Blob([currentContent]).size;
  const sizePercent = (contentSize / SIZE_LIMIT) * 100;
  const sizeColor =
    sizePercent > 90
      ? 'text-red-500'
      : sizePercent > 70
        ? 'text-amber-500'
        : 'text-muted-foreground';

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Top bar: mode toggle, template, AI assist, save */}
      <div className="flex items-center justify-between">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          <button
            type="button"
            onClick={mode === 'raw' ? switchToGuided : undefined}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              mode === 'guided'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            引导模式
          </button>
          <button
            type="button"
            onClick={mode === 'guided' ? switchToRaw : undefined}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              mode === 'raw'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            原始模式
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateDialogOpen(true)}
            className="gap-1.5 text-xs"
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            模板
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiDialogOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 辅助编写
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !validation.valid}
            className="gap-1.5 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? '保存中...' : '保存草稿'}
          </Button>
        </div>
        {saveError && <div className="mt-1 text-xs text-red-500">{saveError}</div>}
      </div>

      {/* Validation + Size indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {validation.valid ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" /> 验证通过
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" /> {validation.errors.length} 个错误
            </span>
          )}
          {validation.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <AlertTriangle className="h-3.5 w-3.5" /> {validation.warnings.length} 个警告
            </span>
          )}
        </div>
        <span className={cn('text-xs', sizeColor)}>
          {(contentSize / 1024).toFixed(1)} KB / {(SIZE_LIMIT / 1024).toFixed(0)} KB
        </span>
      </div>

      {/* Editor + Preview split */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Editor */}
        <div className="space-y-4">
          {mode === 'guided' ? (
            <>
              {/* Frontmatter form */}
              <FrontmatterForm value={frontmatter} onChange={setFrontmatter} />
              {/* Divider */}
              <div className="border-t border-border" />
              {/* Body content */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  正文内容 (Markdown)
                </label>
                <Textarea
                  placeholder="编写技能的详细指令、步骤、示例..."
                  value={bodyContent}
                  onChange={(e) => setBodyContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </>
          ) : (
            <Textarea
              placeholder="---&#10;name: my-skill&#10;description: Describe what this skill does.&#10;---&#10;&#10;# My Skill&#10;&#10;## Instructions&#10;..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              className="min-h-[560px] font-mono text-sm"
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className="rounded-xl border border-border bg-card p-4 overflow-y-auto max-h-[640px]">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileCode className="h-3.5 w-3.5" />
            预览
          </div>
          <SkillPreview content={currentContent} />
        </div>
      </div>

      {/* Validation Report (detailed) */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <ValidationReport
          errors={validation.errors}
          warnings={validation.warnings}
          valid={validation.valid}
        />
      )}

      {/* Template Picker Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>选择技能模板</DialogTitle>
            <DialogDescription>选择一个模板作为起点，然后根据需要修改</DialogDescription>
          </DialogHeader>
          <SkillTemplatePicker selected={null} onSelect={handleTemplateSelect} />
        </DialogContent>
      </Dialog>

      {/* AI Assist Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>AI 辅助编写</DialogTitle>
            <DialogDescription>描述你想要的技能，AI 会帮你生成 SKILL.md</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                技能描述
              </label>
              <Textarea
                placeholder="描述你想要的技能功能、使用场景、输出格式..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                className="min-h-[120px] text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                模板类型
              </label>
              <select
                value={aiTemplateType}
                onChange={(e) => setAiTemplateType(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="basic">基础技能</option>
                <option value="agent">Agent 工作流</option>
                <option value="workflow">结构化工作流</option>
                <option value="pm-specialist">产品经理专项</option>
              </select>
            </div>

            <Button
              onClick={handleAiAssist}
              disabled={!aiDescription.trim() || aiLoading}
              className="w-full gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              {aiLoading ? '生成中...' : '生成技能'}
            </Button>

            {/* AI Result */}
            {aiResult && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                {aiResult.explanation && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">设计思路</p>
                    <p className="text-sm text-foreground">{aiResult.explanation}</p>
                  </div>
                )}
                {aiResult.tips.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">使用提示</p>
                    <ul className="space-y-1">
                      {aiResult.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-foreground">
                          - {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.skill_content && (
                  <Button onClick={handleApplyAiResult} size="sm" className="w-full">
                    应用到编辑器
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
