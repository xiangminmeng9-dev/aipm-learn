'use client';

import { useState, useCallback } from 'react';
import { marked } from 'marked';

interface ResumeData {
  name?: string;
  contact?: { phone?: string; email?: string; location?: string; linkedin?: string; github?: string };
  summary?: string;
  work_experience?: { company: string; position: string; period: string; highlights: string[] }[];
  projects?: { name: string; role?: string; period?: string; description?: string; highlights: string[] }[];
  education?: { school: string; degree: string; major: string; period: string; highlights?: string[] }[];
  skills?: { category: string; items: string[] }[];
}

interface ResumePDFExportButtonProps {
  modifiedResume: string;
  analysis: unknown;
  changesSummary: string;
  companyName: string;
  positionName: string;
  resumeData: ResumeData | null;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildStructuredHtml(data: ResumeData): string {
  const c = data.contact || {};

  // === SIDEBAR ===
  let sb = '';

  // Avatar circle with initials
  const initials = (data.name || 'R').slice(0, 1);
  sb += '<div class="avatar"><div class="avatar-inner">' + esc(initials) + '</div></div>';
  sb += '<div class="sb-name">' + esc(data.name || '') + '</div>';
  if (data.summary) sb += '<div class="sb-sum">' + esc(data.summary) + '</div>';

  // Contact
  const contactItems = [
    c.phone ? '<div class="ct-row"><svg class="ct-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg><span>' + esc(c.phone) + '</span></div>' : '',
    c.email ? '<div class="ct-row"><svg class="ct-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg><span>' + esc(c.email) + '</span></div>' : '',
    c.location ? '<div class="ct-row"><svg class="ct-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span>' + esc(c.location) + '</span></div>' : '',
    c.linkedin ? '<div class="ct-row"><svg class="ct-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-6"/><polyline points="15 8 12 5 9 8"/><line x1="12" y1="5" x2="12" y2="17"/></svg><span>' + esc(c.linkedin) + '</span></div>' : '',
    c.github ? '<div class="ct-row"><svg class="ct-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg><span>' + esc(c.github) + '</span></div>' : '',
  ].filter(Boolean).join('');

  if (contactItems) {
    sb += '<div class="sb-sec"><div class="sb-title">联系方式</div>' + contactItems + '</div>';
  }

  // Skills
  if (data.skills?.length) {
    sb += '<div class="sb-sec"><div class="sb-title">专业技能</div>';
    for (const s of data.skills) {
      sb += '<div class="sk-grp"><div class="sk-cat">' + esc(s.category) + '</div><div class="sk-tags">';
      for (const item of s.items) sb += '<span class="sk-tag">' + esc(item) + '</span>';
      sb += '</div></div>';
    }
    sb += '</div>';
  }

  // Education
  if (data.education?.length) {
    sb += '<div class="sb-sec"><div class="sb-title">教育背景</div>';
    for (const e of data.education) {
      sb += '<div class="edu-item">';
      sb += '<div class="edu-school">' + esc(e.school) + '</div>';
      sb += '<div class="edu-major">' + esc([e.degree, e.major].filter(Boolean).join(' · ')) + '</div>';
      sb += '<div class="edu-per">' + esc(e.period) + '</div>';
      sb += '</div>';
    }
    sb += '</div>';
  }

  // === MAIN CONTENT ===
  let mn = '';

  // Work Experience
  if (data.work_experience?.length) {
    mn += '<div class="mn-sec"><div class="mn-title">工作经历</div>';
    for (const w of data.work_experience) {
      mn += '<div class="exp">';
      mn += '<div class="exp-top"><div class="exp-pos">' + esc(w.position) + '</div><div class="exp-dot"></div><div class="exp-per">' + esc(w.period) + '</div></div>';
      mn += '<div class="exp-co">' + esc(w.company) + '</div>';
      mn += '<ul class="exp-hl">';
      for (const h of w.highlights) mn += '<li>' + esc(h) + '</li>';
      mn += '</ul></div>';
    }
    mn += '</div>';
  }

  // Projects
  if (data.projects?.length) {
    mn += '<div class="mn-sec"><div class="mn-title">项目经验</div>';
    for (const p of data.projects) {
      mn += '<div class="exp">';
      mn += '<div class="exp-top"><div class="exp-pos">' + esc(p.name) + '</div>';
      if (p.period) mn += '<div class="exp-dot"></div><div class="exp-per">' + esc(p.period) + '</div>';
      mn += '</div>';
      if (p.role || p.description) mn += '<div class="exp-co">' + esc([p.role, p.description].filter(Boolean).join(' — ')) + '</div>';
      mn += '<ul class="exp-hl">';
      for (const h of p.highlights) mn += '<li>' + esc(h) + '</li>';
      mn += '</ul></div>';
    }
    mn += '</div>';
  }

  return '<div class="page"><div class="sidebar">' + sb + '</div><div class="main">' + mn + '</div></div>';
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
}

function buildFallbackHtml(modifiedResume: string, positionName: string, companyName: string): string {
  const mdHtml = sanitizeHtml(marked.parse(modifiedResume || '') as string);
  let sb = '<div class="avatar"><div class="avatar-inner">' + esc((positionName || 'R').slice(0, 1)) + '</div></div>';
  sb += '<div class="sb-name">' + esc(positionName || '简历') + '</div>';
  if (companyName) sb += '<div class="sb-sum">目标：' + esc(companyName) + '</div>';

  return '<div class="page"><div class="sidebar">' + sb + '</div><div class="main main-full">' + mdHtml + '</div></div>';
}

const CSS = `
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Helvetica Neue",Arial,sans-serif;font-size:9.5pt;line-height:1.6;color:#333;background:#fff;-webkit-font-smoothing:antialiased}

.page{width:794px;min-height:1123px;display:flex;background:#fff}

/* ===== SIDEBAR ===== */
.sidebar{width:230px;background:linear-gradient(180deg,#0f172a 0%,#1e293b 100%);color:#e2e8f0;padding:32px 20px 28px;flex-shrink:0;display:flex;flex-direction:column;gap:20px}

.avatar{display:flex;justify-content:center;margin-bottom:4px}
.avatar-inner{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:24pt;font-weight:800;color:#fff;letter-spacing:2pt}

.sb-name{text-align:center;font-size:14pt;font-weight:800;color:#fff;letter-spacing:3pt}
.sb-sum{text-align:center;font-size:8.5pt;color:#94a3b8;margin-top:2px;line-height:1.4}

.sb-sec{}
.sb-title{font-size:8pt;font-weight:700;color:#60a5fa;letter-spacing:2pt;text-transform:uppercase;padding-bottom:6px;border-bottom:1px solid rgba(96,165,250,0.3);margin-bottom:10px}

.ct-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:8pt;color:#cbd5e1;word-break:break-all}
.ct-icon{width:12px;height:12px;flex-shrink:0;color:#60a5fa}

.sk-grp{margin-bottom:10px}
.sk-grp:last-child{margin-bottom:0}
.sk-cat{font-size:7.5pt;font-weight:600;color:#60a5fa;margin-bottom:5px;letter-spacing:0.5pt}
.sk-tags{display:flex;flex-wrap:wrap;gap:4px}
.sk-tag{font-size:7.5pt;background:rgba(59,130,246,0.15);color:#93c5fd;padding:2px 8px;border-radius:10px;font-weight:500;border:1px solid rgba(59,130,246,0.2)}

.edu-item{margin-bottom:10px}
.edu-item:last-child{margin-bottom:0}
.edu-school{font-size:9pt;font-weight:700;color:#f1f5f9}
.edu-major{font-size:8pt;color:#94a3b8;margin-top:1px}
.edu-per{font-size:7.5pt;color:#64748b;margin-top:1px}

/* ===== MAIN CONTENT ===== */
.main{flex:1;padding:28px 32px 28px;min-width:0}
.main-full{}

.mn-sec{margin-bottom:20px}
.mn-sec:last-child{margin-bottom:0}

.mn-title{font-size:11pt;font-weight:700;color:#0f172a;letter-spacing:1pt;padding-bottom:7px;border-bottom:2.5px solid #0f172a;margin-bottom:14px;position:relative}
.mn-title::after{content:'';position:absolute;bottom:-2.5px;left:0;width:40px;height:2.5px;background:linear-gradient(90deg,#3b82f6,#8b5cf6)}

/* Experience entry */
.exp{margin-bottom:16px;position:relative;padding-left:16px}
.exp:last-child{margin-bottom:0}
.exp::before{content:'';position:absolute;left:0;top:6px;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 0 0 3px rgba(59,130,246,0.15)}
.exp::after{content:'';position:absolute;left:3.5px;top:18px;bottom:-16px;width:1px;background:#e2e8f0}
.exp:last-child::after{display:none}

.exp-top{display:flex;align-items:center;gap:8px;margin-bottom:2px}
.exp-pos{font-size:10pt;font-weight:700;color:#0f172a}
.exp-dot{width:4px;height:4px;border-radius:50%;background:#cbd5e1;flex-shrink:0}
.exp-per{font-size:8.5pt;color:#64748b;white-space:nowrap;flex-shrink:0}
.exp-co{font-size:9pt;color:#3b82f6;font-weight:600;margin-bottom:5px}

.exp-hl{list-style:none;padding:0}
.exp-hl li{font-size:9pt;line-height:1.6;margin-bottom:3px;color:#334155;position:relative;padding-left:12px}
.exp-hl li::before{content:'';position:absolute;left:0;top:8px;width:4px;height:1px;background:#94a3b8}

/* Markdown fallback */
.main h2{font-size:11pt;font-weight:700;color:#0f172a;letter-spacing:1pt;padding-bottom:7px;border-bottom:2.5px solid #0f172a;margin:20px 0 12px;position:relative}
.main h2::after{content:'';position:absolute;bottom:-2.5px;left:0;width:40px;height:2.5px;background:linear-gradient(90deg,#3b82f6,#8b5cf6)}
.main h3{font-size:10pt;font-weight:700;color:#0f172a;margin:10px 0 3px}
.main h1{font-size:14pt;font-weight:800;color:#0f172a;margin-bottom:6px}
.main p{margin-bottom:5px;text-align:justify;font-size:9pt}
.main strong{font-weight:700;color:#0f172a}
.main em{color:#64748b}
.main ul{list-style:none;padding:0;margin-bottom:5px}
.main ul li{font-size:9pt;line-height:1.6;margin-bottom:3px;color:#334155;position:relative;padding-left:12px}
.main ul li::before{content:'';position:absolute;left:0;top:8px;width:4px;height:1px;background:#94a3b8}
.main ol{margin-left:16px;margin-bottom:5px}
.main ol li{margin-bottom:2px;font-size:9pt}
.main hr{border:none;border-top:0.5px solid #e2e8f0;margin:10px 0}
.main a{color:#3b82f6;text-decoration:none}
.main blockquote{border-left:2.5px solid #3b82f6;padding-left:10px;margin:4px 0;color:#64748b;font-style:italic;font-size:9pt}
`;

export default function ResumePDFExportButton({
  modifiedResume,
  resumeData,
  companyName,
  positionName,
}: ResumePDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const domToImage = (await import('dom-to-image-more')).default;
      const { jsPDF } = await import('jspdf');

      const resumeHtml = (resumeData && (resumeData.name || resumeData.work_experience))
        ? buildStructuredHtml(resumeData)
        : buildFallbackHtml(modifiedResume, positionName, companyName);

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';

      const styleEl = document.createElement('style');
      styleEl.textContent = CSS;

      const page = document.createElement('div');
      page.className = 'page';
      page.innerHTML = resumeHtml;

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
        inner.style.cssText = 'position:absolute;left:0;top:' + (-i * A4_H) + 'px;width:' + A4_W + 'px;';
        inner.innerHTML = resumeHtml;

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

      const name = resumeData?.name || companyName || '优化版';
      pdf.save('简历_' + name + '_' + new Date().toISOString().slice(0, 10) + '.pdf');

      container.remove();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setLoading(false);
    }
  }, [modifiedResume, resumeData, companyName, positionName]);

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
