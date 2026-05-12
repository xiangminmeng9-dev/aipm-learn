'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

export default function ResumeRepositoryUploadDialog({ open, onClose, onUploaded }: Props) {
  const [companyName, setCompanyName] = useState('');
  const [positionName, setPositionName] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdLink, setJdLink] = useState('');
  const [fileName, setFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setUploading(true);

    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/resume/parse', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      setResumeText(data.text || '');
    } else {
      setError('文件解析失败，请尝试粘贴文本');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!companyName.trim() || !positionName.trim() || !resumeText.trim()) return;
    setUploading(true);
    const res = await fetch('/api/resume/repository', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: companyName.trim(),
        position_name: positionName.trim(),
        jd_text: jdText.trim(),
        jd_link: jdLink.trim() || null,
        file_name: fileName || null,
        resume_text: resumeText.trim(),
      }),
    });
    if (res.ok) {
      onUploaded();
      onClose();
      setCompanyName('');
      setPositionName('');
      setJdText('');
      setJdLink('');
      setFileName('');
      setResumeText('');
    } else {
      setError('保存失败');
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>上传简历</DialogTitle>
          <DialogDescription>上传简历文件并关联对应的公司和岗位。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">公司名称 *</label>
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="如：字节跳动" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">岗位名称 *</label>
              <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={positionName} onChange={(e) => setPositionName(e.target.value)} placeholder="如：AI产品经理" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">JD 描述</label>
            <textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" rows={3} value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="粘贴岗位描述..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">JD 链接</label>
            <input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={jdLink} onChange={(e) => setJdLink(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">上传简历文件</label>
            <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              {fileName ? <span className="text-indigo-600 font-medium">{fileName}</span> : '选择 PDF 或 DOCX 文件'}
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">简历文本</label>
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="上传文件自动解析，或直接粘贴简历文本..."
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={uploading || !companyName.trim() || !positionName.trim() || !resumeText.trim()}>
              {uploading ? '处理中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
