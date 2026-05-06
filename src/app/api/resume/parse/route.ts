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
      const pdfParse = await import('pdf-parse');
      const uint8 = new Uint8Array(fileData.data);
      const parser = new pdfParse.PDFParse({ data: uint8, useWorker: false } as Record<string, unknown>);
      const result = await parser.getText();
      await parser.destroy();
      return NextResponse.json({ text: typeof result === 'string' ? result : result.text ?? String(result) });
    }

    if (fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileData.data });
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
