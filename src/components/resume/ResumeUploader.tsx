'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResumeUploaderProps {
  onTextExtracted: (text: string) => void;
}

export default function ResumeUploader({ onTextExtracted }: ResumeUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx'].includes(ext)) {
      setError('仅支持 PDF 和 DOCX 格式');
      return;
    }

    setIsUploading(true);
    setError('');
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '解析失败，请重试');
        setFileName('');
        return;
      }

      onTextExtracted(data.text || '');
    } catch {
      setError('网络错误，请重试');
      setFileName('');
    } finally {
      setIsUploading(false);
    }
  }, [onTextExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePasteSubmit = useCallback(() => {
    const trimmed = pasteText.trim();
    if (!trimmed) return;
    onTextExtracted(trimmed);
  }, [pasteText, onTextExtracted]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50/50'
            : error
            ? 'border-rose-300 bg-rose-50/30'
            : fileName
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-[#D1D5DB] bg-white hover:border-indigo-300 hover:bg-indigo-50/20'
        }`}
        whileHover={!isUploading ? { scale: 1.01 } : {}}
        whileTap={!isUploading ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-sm text-[#6B7280]">正在解析简历...</p>
            </motion.div>
          ) : fileName && !error ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-700">{fileName}</p>
              <p className="text-xs text-[#6B7280]">点击重新上传</p>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
                <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1F2937]">拖拽或点击上传简历</p>
                <p className="mt-1 text-xs text-[#9CA3AF]">支持 PDF、DOCX 格式</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/50 px-4 py-2.5"
          >
            <p className="text-sm text-rose-600">{error}</p>
            <button
              onClick={() => { setError(''); setFileName(''); }}
              className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors"
            >
              重试
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paste fallback toggle */}
      <div className="text-center">
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="text-xs text-[#9CA3AF] hover:text-indigo-500 transition-colors"
        >
          {showPaste ? '收起' : '或直接粘贴简历文本'}
        </button>
      </div>

      {/* Paste textarea */}
      <AnimatePresence>
        {showPaste && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="在此粘贴简历文本内容..."
              className="app-input w-full min-h-[120px] resize-none p-4 text-sm"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">{pasteText.length} 字符</span>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="app-btn-primary rounded-lg px-4 py-1.5 text-xs disabled:opacity-50"
              >
                使用此文本
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
