import { NextRequest, NextResponse } from 'next/server';
import YAML from 'yaml';

const NAME_REGEX = /^[a-z0-9][a-z0-9-]*$/;
const NAME_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body as { content?: string };

    if (!content?.trim()) {
      return NextResponse.json({
        valid: false,
        errors: ['SKILL.md 内容为空'],
        warnings: [],
      });
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Parse frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      return NextResponse.json({
        valid: false,
        errors: ['缺少 YAML frontmatter（需要 --- 包裹的头部）'],
        warnings: [],
      });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = YAML.parse(match[1]) as Record<string, unknown>;
    } catch {
      return NextResponse.json({
        valid: false,
        errors: ['YAML frontmatter 格式错误，请检查语法'],
        warnings: [],
      });
    }

    // Validate name
    if (!parsed.name) {
      errors.push('缺少必填字段: name');
    } else {
      const name = String(parsed.name);
      if (!NAME_REGEX.test(name)) {
        errors.push('name 格式错误: 仅允许小写字母、数字和连字符，且以字母或数字开头');
      }
      if (name.length < 1) {
        errors.push('name 不能为空');
      }
      if (name.length > NAME_MAX_LENGTH) {
        errors.push(`name 长度超过 ${NAME_MAX_LENGTH} 字符`);
      }
    }

    // Validate description
    if (!parsed.description) {
      errors.push('缺少必填字段: description');
    } else {
      const desc = String(parsed.description);
      if (desc.length < 1) {
        errors.push('description 不能为空');
      }
      if (desc.length > DESCRIPTION_MAX_LENGTH) {
        errors.push(`description 长度超过 ${DESCRIPTION_MAX_LENGTH} 字符`);
      }
    }

    // Warnings
    const bodyText = content.slice(match[0].length).trim();
    if (!bodyText) {
      warnings.push('正文内容为空，建议添加详细指令');
    }

    if (parsed.effort && !['low', 'medium', 'high'].includes(String(parsed.effort))) {
      warnings.push('effort 值应为 low/medium/high');
    }

    if (!parsed['allowed-tools']) {
      warnings.push('建议添加 allowed-tools 字段声明技能可用工具');
    }

    if (parsed.metadata && typeof parsed.metadata === 'object') {
      const meta = parsed.metadata as Record<string, unknown>;
      if (!meta.version) {
        warnings.push('建议在 metadata 中添加 version 字段');
      }
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
      warnings,
    });
  } catch (err) {
    console.error('[skill-validate] Error:', err);
    return NextResponse.json(
      { valid: false, errors: ['验证过程出错'], warnings: [] },
      { status: 500 }
    );
  }
}
