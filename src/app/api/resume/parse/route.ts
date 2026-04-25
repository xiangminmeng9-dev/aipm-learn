import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: '请上传文件', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小不能超过5MB', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    if (fileName.endsWith('.pdf')) {
      const pdfParse = await import('pdf-parse');
      const uint8 = new Uint8Array(arrayBuffer);
      const parser = new pdfParse.PDFParse({ data: uint8 });
      const result = await parser.getText();
      await parser.destroy();
      return NextResponse.json({ text: typeof result === 'string' ? result : result.text ?? String(result) });
    }

    if (fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth');
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value });
    }

    return NextResponse.json(
      { error: '仅支持 PDF 和 DOCX 格式文件', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Resume parse API error:', error);
    return NextResponse.json({ error: '文件解析失败', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
