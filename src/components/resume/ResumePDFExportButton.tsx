'use client';

import { useState, useCallback } from 'react';
import { marked } from 'marked';

interface ResumePDFExportButtonProps {
  modifiedResume: string;
  analysis: unknown;
  changesSummary: string;
  companyName: string;
  positionName: string;
  resumeData: unknown;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

// CSS that exactly matches the page's Markdown component styling (markdown.tsx)
const CSS = `
@page{size:A4;margin:0}
.resume-page *{margin:0;padding:0;box-sizing:border-box;border:none;outline:none;box-shadow:none;border-radius:0;background:none}
.resume-page{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Helvetica Neue",Arial,sans-serif;font-size:10pt;line-height:1.8;color:#1a1a1a;background:#fff;-webkit-font-smoothing:antialiased;width:794px;padding:48px 56px}

/* Match markdown.tsx component styles exactly */
.resume-page h1{font-size:18pt;font-weight:800;color:#1a1a1a;margin:0 0 6px;border:none}
.resume-page h2{font-size:14pt;font-weight:700;color:#4338ca;padding-bottom:4px;border-bottom:1px solid #c7d2fe;margin:16px 0 10px}
.resume-page h3{font-size:11pt;font-weight:600;color:#1e1b4b;margin:10px 0 3px}
.resume-page h4{font-size:10pt;font-weight:600;color:#1a1a1a;margin:8px 0 2px}
.resume-page p{margin:6px 0;text-align:justify;font-size:10pt;line-height:1.8;color:#1a1a1a}
.resume-page strong{font-weight:700;color:#4338ca}
.resume-page em{color:#64748b;font-style:italic}
.resume-page ul{list-style:disc;margin:6px 0 8px 24px;padding:0}
.resume-page ul li{font-size:10pt;line-height:1.8;margin-bottom:2px;color:#1a1a1a}
.resume-page ol{list-style:decimal;margin:6px 0 8px 24px;padding:0}
.resume-page ol li{font-size:10pt;line-height:1.8;margin-bottom:2px;color:#1a1a1a}
.resume-page blockquote{border-left:3px solid #818cf8;padding:3px 0 3px 12px;margin:6px 0;color:#64748b;font-style:italic;font-size:10pt;background:#f5f3ff;border-radius:0 4px 4px 0}
.resume-page hr{border:none;border-top:0.5px solid #e2e8f0;margin:10px 0}
.resume-page a{color:#4338ca;text-decoration:none}
.resume-page code{font-size:9pt;background:#f1f5f9;padding:1px 4px;border-radius:3px;color:#4338ca}
.resume-page pre{background:#1e293b;color:#e2e8f0;padding:12px;border-radius:8px;font-size:8.5pt;overflow-x:auto;margin:8px 0}
.resume-page pre code{background:#1e293b;color:#e2e8f0;padding:0;border-radius:0}
.resume-page table{width:100%;border-collapse:collapse;margin:8px 0;font-size:9.5pt}
.resume-page th{background:#f5f3ff;font-weight:600;color:#4338ca;padding:6px 8px;text-align:left;border-bottom:1px solid #c7d2fe}
.resume-page td{padding:6px 8px;border-bottom:1px solid #e2e8f0;color:#1a1a1a}
`;

export default function ResumePDFExportButton({
  modifiedResume,
}: ResumePDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const domToImage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const mdHtml = sanitizeHtml(marked.parse(modifiedResume || '') as string);

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';

      const styleEl = document.createElement('style');
      styleEl.textContent = CSS;

      const page = document.createElement('div');
      page.className = 'resume-page';
      page.innerHTML = mdHtml;

      container.appendChild(styleEl);
      container.appendChild(page);
      document.body.appendChild(container);

      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));

      const A4_W = 794;
      const A4_H = 1123;
      const totalHeight = page.scrollHeight;
      const totalPages = Math.max(1, Math.ceil(totalHeight / A4_H));
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'width:' + A4_W + 'px;height:' + A4_H + 'px;overflow:hidden;position:relative;background:#fff;';

        const inner = document.createElement('div');
        inner.className = 'resume-page';
        inner.innerHTML = mdHtml;
        inner.style.cssText = 'position:absolute;left:0;top:' + (-i * A4_H) + 'px;width:' + A4_W + 'px;padding:48px 56px;background:#fff;';

        wrapper.appendChild(inner);
        container.innerHTML = '';
        container.appendChild(styleEl);
        container.appendChild(wrapper);

        const dataUrl = await domToImage.toPng(wrapper, {
          quality: 1,
          scale: 2,
          bgcolor: '#ffffff',
          width: A4_W,
          height: A4_H,
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297);
      }

      // Filename
      const nameMatch = modifiedResume?.match(/^#{1,2}\s+(.+)/m) || modifiedResume?.match(/^(.+)$/m);
      const extractedName = nameMatch ? nameMatch[1].replace(/[|｜].*$/, '').trim() : '';
      const name = extractedName || '优化版';
      pdf.save('简历_' + name + '_' + new Date().toISOString().slice(0, 10) + '.pdf');

      container.remove();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setLoading(false);
    }
  }, [modifiedResume]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <span className="text-sm font-medium text-foreground">导出 PDF</span>
      </div>
      <button onClick={handleExport} disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
        {loading ? '生成中...' : '下载 PDF'}
      </button>
      <button onClick={handlePrint} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
        打印 / 另存为 PDF
      </button>
    </div>
  );
}