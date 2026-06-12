import { NextRequest, NextResponse } from 'next/server';
import * as multipart from 'parse-multipart-data';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function extractBoundary(contentType: string, body: Buffer): string | null {
  // Try from Content-Type header first
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/);
  if (match) return match[1] || match[2];

  // Fallback: detect boundary from body (first line starts with --)
  const bodyStr = body.toString('utf-8', 0, Math.min(body.length, 200));
  const lineMatch = bodyStr.match(/^--([^\r\n]+)/);
  return lineMatch ? lineMatch[1] : null;
}

/**
 * Convert PDF raw text to Markdown with structural formatting.
 * pdf-parse only gives plain text, so we reconstruct structure from patterns.
 */
function pdfTextToMarkdown(text: string): string {
  const lines = text.split(/\n/);
  const result: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) {
      result.push('');
      continue;
    }

    // Detect section headers (common Chinese resume patterns)
    // e.g. "个人信息", "工作经历", "项目经历", "教育背景", "专业技能", "自我评价"
    if (/^[一二三四五六七八九十\d]+[、.．]\s*/.test(line) ||
        /^(个人信息|联系方式|工作经历|项目经历|教育背景|专业技能|自我评价|个人评价|技能特长|求职意向|工作内容|项目经验|实习经历|校园经历|获奖情况|证书|语言能力|兴趣爱好)\s*$/.test(line) ||
        /^(Personal Info|Contact|Work Experience|Project|Education|Skills|Summary|Objective|Projects)\s*$/i.test(line)) {
      result.push('## ' + line);
      continue;
    }

    // Detect company/position lines with date patterns
    // e.g. "产品经理 | 字节跳动  2020.03 - 至今"
    if (/\d{4}\.\d{2}\s*[-–—]\s*(至今|\d{4}\.\d{2})/.test(line) ||
        /\d{4}\/\d{2}\s*[-–—]\s*(至今|\d{4}\/\d{2})/.test(line) ||
        /\d{4}\s*[-–—]\s*(至今|present|\d{4})/.test(line)) {
      // Check if it looks like a position/company line (not just a date-only line)
      const textBeforeDate = line.split(/\d{4}/)[0].trim();
      if (textBeforeDate.length >= 2) {
        result.push('### ' + line);
        continue;
      }
    }

    // Detect bullet points (- • · ○ ◉ ► ▸ ▹ * etc.)
    if (/^[•·○◉►▸▹\-*]\s*/.test(line)) {
      result.push('- ' + line.replace(/^[•·○◉►▸▹\-*]\s*/, ''));
      continue;
    }

    // Detect numbered items (1. 2. 3. etc.)
    if (/^\d+[.、．)]\s*/.test(line)) {
      result.push(line);
      continue;
    }

    // Detect name (usually the first non-empty line, short, no special chars)
    if (result.filter(l => l.trim()).length === 0 && line.length <= 10 && !/[@|/\\]/.test(line)) {
      result.push('## ' + line);
      continue;
    }

    // Default: plain paragraph
    result.push(line);
  }

  return result.join('\n');
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    const bodyBuffer = Buffer.from(await request.arrayBuffer());

    let fileData: { name: string; data: Buffer } | null = null;

    if (contentType.includes('multipart/form-data') || bodyBuffer.length > 0) {
      const boundary = extractBoundary(contentType, bodyBuffer);
      if (boundary) {
        const parts = multipart.parse(bodyBuffer, boundary);
        const filePart = parts.find(p => p.name === 'file');
        if (filePart) {
          fileData = { name: filePart.filename || 'unknown', data: filePart.data };
        }
      }
    }

    // Fallback: try request.formData()
    if (!fileData) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (file) {
          const arrayBuffer = await file.arrayBuffer();
          fileData = { name: file.name, data: Buffer.from(arrayBuffer) };
        }
      } catch {
        // formData() not available
      }
    }

    if (!fileData) {
      return NextResponse.json({ error: '请上传文件', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    if (fileData.data.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过5MB', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    const fileName = fileData.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      // PDF: extract text, then convert to structured Markdown
      const pdfParse = await import('pdf-parse');
      const uint8 = new Uint8Array(fileData.data);
      const parser = new pdfParse.PDFParse({ data: uint8, useWorker: false } as Record<string, unknown>);
      const result = await parser.getText();
      await parser.destroy();
      const rawText = typeof result === 'string' ? result : result.text ?? String(result);
      const markdown = pdfTextToMarkdown(rawText);
      return NextResponse.json({ text: markdown });
    }

    if (fileName.endsWith('.docx')) {
      // DOCX: use mammoth.convertToMarkdown to preserve formatting and structure
      const mammoth = await import('mammoth');
      const mammothModule = mammoth as unknown as { convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }> };
      const result = await mammothModule.convertToMarkdown({ buffer: fileData.data });
      return NextResponse.json({ text: result.value });
    }

    return NextResponse.json(
      { error: '仅支持 PDF 和 DOCX 格式文件', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Resume parse API error:', error);
    return NextResponse.json({ error: '文件解析失败，请确认文件格式正确且未损坏', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
