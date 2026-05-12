'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, X, Search, Trash2, Download, Clock, Plus, Edit2, Eye, Send, MessageSquare, Award } from 'lucide-react';
import GradientBackground from '@/components/ui/gradient-background';

// 文件数据（存储在 IndexedDB）
interface ResumeFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
  version: string;
}

// 卡片元数据（存储在 localStorage，不含文件内容）
interface ResumeCardMeta {
  id: string;
  positionType: string;
  abbreviation: string;
  language: '中文' | '英文' | '中英双语';
  useCase: string;
  companyName?: string;
  fileIds: string[]; // 文件ID列表
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
  createdAt: string;
}

// 完整卡片（包含文件数据）
interface ResumeCard extends ResumeCardMeta {
  files: ResumeFile[];
}

const POSITION_TYPES = [
  { name: '产品经理', abbr: 'PM', color: '#6366F1' },
  { name: '产品运营', abbr: 'PO', color: '#10B981' },
  { name: 'AI产品经理', abbr: 'AI-PM', color: '#8B5CF6' },
  { name: '数据产品经理', abbr: 'DPM', color: '#F59E0B' },
  { name: '用户研究', abbr: 'UR', color: '#EC4899' },
  { name: '项目经理', abbr: 'PJ', color: '#06B6D4' },
];

const STORAGE_KEY = 'resume_repository_v4';
const DB_NAME = 'ResumeRepositoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// IndexedDB 操作
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function saveFileToDB(file: ResumeFile): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getFileFromDB(id: string): Promise<ResumeFile | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFileFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllFilesFromDB(): Promise<ResumeFile[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// localStorage 操作（只存元数据）
function loadCardMetas(): ResumeCardMeta[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCardMetas(cards: ResumeCardMeta[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {}
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function downloadFile(file: ResumeFile) {
  const link = document.createElement('a');
  link.href = file.dataUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 编辑弹窗
function EditDialog({ open, onClose, card, onSaved }: { open: boolean; onClose: () => void; card: ResumeCard | null; onSaved: () => void }) {
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [interviewsCount, setInterviewsCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = card ? `edit-resume-file-${card.id}` : 'edit-resume-file';

  useEffect(() => {
    if (open && card) {
      setApplicationsCount(card.applicationsCount || 0);
      setInterviewsCount(card.interviewsCount || 0);
      setOffersCount(card.offersCount || 0);
      const versions = card.files.map(f => parseFloat(f.version.replace('v', '')) || 0);
      const maxVersion = versions.length > 0 ? Math.max(...versions) : 0;
      setVersion(`v${(maxVersion + 0.1).toFixed(1)}`);
      setFile(null);
      setError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, card]);

  if (!open || !card) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');

    if (file) {
      // 有新文件，异步读取
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileId = Date.now().toString();
          const newFile: ResumeFile = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: reader.result as string,
            uploadedAt: new Date().toISOString(),
            version: version.startsWith('v') ? version : `v${version}`,
          };

          // 保存文件到 IndexedDB
          await saveFileToDB(newFile);

          // 更新卡片元数据
          const currentMetas = loadCardMetas();
          const idx = currentMetas.findIndex(c => c.id === card.id);
          if (idx >= 0) {
            currentMetas[idx].fileIds.push(fileId);
            currentMetas[idx].applicationsCount = applicationsCount;
            currentMetas[idx].interviewsCount = interviewsCount;
            currentMetas[idx].offersCount = offersCount;
            saveCardMetas(currentMetas);
          }

          setSaving(false);
          onSaved();
          onClose();
        } catch (e) {
          console.error('保存失败:', e);
          setError('保存失败: ' + (e instanceof Error ? e.message : '未知错误'));
          setSaving(false);
        }
      };
      reader.onerror = () => {
        setError('文件读取失败');
        setSaving(false);
      };
      reader.readAsDataURL(file);
    } else {
      // 没有新文件，直接保存统计数据
      const currentMetas = loadCardMetas();
      const idx = currentMetas.findIndex(c => c.id === card.id);
      if (idx >= 0) {
        currentMetas[idx].applicationsCount = applicationsCount;
        currentMetas[idx].interviewsCount = interviewsCount;
        currentMetas[idx].offersCount = offersCount;
        saveCardMetas(currentMetas);
      }
      setSaving(false);
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-xl border border-border bg-card shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">编辑简历</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">投递数</label>
              <input type="number" min={0} value={applicationsCount} onChange={(e) => setApplicationsCount(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">面试数</label>
              <input type="number" min={0} value={interviewsCount} onChange={(e) => setInterviewsCount(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Offer数</label>
              <input type="number" min={0} value={offersCount} onChange={(e) => setOffersCount(Number(e.target.value))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <label className="block text-sm text-muted-foreground mb-2">上传新版本</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="版本号"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary mb-3" />
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(''); }} className="hidden" id={fileInputId} />
            <label htmlFor={fileInputId} className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-4 py-4 text-sm text-muted-foreground cursor-pointer hover:border-primary hover:text-foreground transition-colors">
              <Upload className="h-4 w-4" />
              {file ? <span className="text-primary font-medium">{file.name}</span> : '点击选择文件'}
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">取消</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}

// 新建弹窗
function NewCardDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [positionType, setPositionType] = useState('产品经理');
  const [language, setLanguage] = useState<'中文' | '英文' | '中英双语'>('中文');
  const [useCase, setUseCase] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const positionInfo = POSITION_TYPES.find(p => p.name === positionType) || POSITION_TYPES[0];

  useEffect(() => {
    if (open) {
      setPositionType('产品经理');
      setLanguage('中文');
      setUseCase('');
      setCompanyName('');
      setVersion('v1.0');
      setFile(null);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleCreate = async () => {
    if (!file) {
      setError('请选择文件');
      return;
    }
    setUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileId = Date.now().toString();
        const cardId = Date.now().toString() + '_card';

        const newFile: ResumeFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
          version: version.startsWith('v') ? version : `v${version}`,
        };

        // 保存文件到 IndexedDB
        await saveFileToDB(newFile);

        // 保存卡片元数据到 localStorage
        const newCardMeta: ResumeCardMeta = {
          id: cardId,
          positionType,
          abbreviation: positionInfo.abbr,
          language,
          useCase: useCase.trim() || `适用于${positionType}岗位投递`,
          companyName: companyName.trim() || undefined,
          fileIds: [fileId],
          applicationsCount: 0,
          interviewsCount: 0,
          offersCount: 0,
          createdAt: new Date().toISOString(),
        };

        const metas = loadCardMetas();
        metas.push(newCardMeta);
        saveCardMetas(metas);

        setUploading(false);
        onCreated();
        onClose();
      } catch (e) {
        console.error('创建失败:', e);
        setError('创建失败: ' + (e instanceof Error ? e.message : '未知错误'));
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError('文件读取失败');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-xl border border-border bg-card shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-foreground">上传简历</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">岗位类型</label>
            <div className="grid grid-cols-3 gap-2">
              {POSITION_TYPES.map((p) => (
                <button key={p.name} onClick={() => setPositionType(p.name)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${positionType === p.name ? 'bg-primary/20 border border-primary/40 text-primary' : 'border border-border text-muted-foreground hover:bg-muted'}`}>{p.abbr}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">语言</label>
            <div className="flex gap-2">
              {(['中文', '英文', '中英双语'] as const).map((l) => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${language === l ? 'bg-primary/20 border border-primary/40 text-primary' : 'border border-border text-muted-foreground hover:bg-muted'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">关联公司（可选）</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="如：字节跳动、腾讯"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">使用场景</label>
            <textarea value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="描述这份简历的适用场景..." rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">版本号</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="如：v1.0"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">上传简历文件 *</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { setFile(e.target.files?.[0] || null); setError(''); }} className="hidden" id="new-resume-file" />
            <label htmlFor="new-resume-file" className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-4 py-6 text-sm text-muted-foreground cursor-pointer hover:border-primary hover:text-foreground transition-colors">
              <Upload className="h-5 w-5" />
              {file ? <span className="text-primary">{file.name}</span> : '选择 PDF 或 Word 文件'}
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">取消</button>
          <button onClick={handleCreate} disabled={!file || uploading} className="px-5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">{uploading ? '上传中...' : '确认上传'}</button>
        </div>
      </div>
    </div>
  );
}

// 版本历史弹窗
function VersionHistoryDialog({ open, onClose, card }: { open: boolean; onClose: () => void; card: ResumeCard | null }) {
  if (!open || !card) return null;
  const positionInfo = POSITION_TYPES.find(p => p.name === card.positionType) || POSITION_TYPES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-xl border border-border bg-card shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: positionInfo.color }}>{card.abbreviation}</span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{card.positionType}</h3>
              <p className="text-xs text-muted-foreground">{card.files.length} 个版本</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {card.files.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无版本</p>
          ) : (
            card.files.map((file, idx) => (
              <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-xs font-bold text-primary">{file.version}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span><span>•</span><span>{new Date(file.uploadedAt).toLocaleDateString('zh-CN')}</span>
                      {idx === 0 && <span className="text-emerald-500">最新</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => downloadFile(file)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"><Download className="h-4 w-4" />下载</button>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">关闭</button>
        </div>
      </div>
    </div>
  );
}

// 简历卡片组件
function ResumeCardItem({ card, onEdit, onPreview, onDelete }: { card: ResumeCard; onEdit: () => void; onPreview: () => void; onDelete: () => void }) {
  const positionInfo = POSITION_TYPES.find(p => p.name === card.positionType) || POSITION_TYPES[0];
  const latestVersion = card.files[0]?.version || '-';

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: positionInfo.color }}>{card.abbreviation}</span>
          <h3 className="text-base font-semibold text-foreground">{card.positionType}</h3>
        </div>
        <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md">{latestVersion}</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{card.language}</span>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{card.files.length} 个版本</span>
        {card.companyName && <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{card.companyName}</span>}
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <Send className="h-4 w-4 text-indigo-500" />
          <span className="text-sm text-muted-foreground">投递</span>
          <span className="text-base font-bold text-foreground">{card.applicationsCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">面试</span>
          <span className="text-base font-bold text-foreground">{card.interviewsCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Award className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-muted-foreground">Offer</span>
          <span className="text-base font-bold text-foreground">{card.offersCount}</span>
        </div>
      </div>
      {card.files[0] && (
        <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-muted/50 border border-border">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-foreground truncate flex-1">{card.files[0].name}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(card.files[0].size)}</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{card.useCase}</p>
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Edit2 className="h-4 w-4" />编辑</button>
        <button onClick={onPreview} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Eye className="h-4 w-4" />预览</button>
        <button onClick={onDelete} className="flex items-center justify-center px-2 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export default function RepositoryPage() {
  const [cards, setCards] = useState<ResumeCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('全部');
  const [showNewCard, setShowNewCard] = useState(false);
  const [editingCard, setEditingCard] = useState<ResumeCard | null>(null);
  const [previewingCard, setPreviewingCard] = useState<ResumeCard | null>(null);

  // 加载数据
  const loadAllData = async () => {
    try {
      const metas = loadCardMetas();
      const allFiles = await getAllFilesFromDB();
      const fileMap = new Map(allFiles.map(f => [f.id, f]));

      // 合并数据
      const mergedCards: ResumeCard[] = metas.map(meta => ({
        ...meta,
        files: meta.fileIds
          .map(id => fileMap.get(id))
          .filter((f): f is ResumeFile => !!f)
          .sort((a, b) => parseFloat(b.version.replace('v', '')) - parseFloat(a.version.replace('v', '')))
      }));

      setCards(mergedCards);
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const refreshCards = () => {
    loadAllData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此简历组件？所有版本将被删除。')) return;

    const card = cards.find(c => c.id === id);
    if (card) {
      // 删除 IndexedDB 中的文件
      for (const file of card.files) {
        await deleteFileFromDB(file.id);
      }
    }

    const metas = loadCardMetas();
    const updated = metas.filter(c => c.id !== id);
    saveCardMetas(updated);
    setCards(cards.filter(c => c.id !== id));
  };

  const searchFiltered = searchQuery.trim() ? cards.filter(c => c.positionType.toLowerCase().includes(searchQuery.toLowerCase()) || c.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) || c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || c.useCase.toLowerCase().includes(searchQuery.toLowerCase())) : cards;
  const filteredCards = filterType === '全部' ? searchFiltered : searchFiltered.filter(c => c.positionType === filterType);
  const totalFilesCount = cards.reduce((sum, c) => sum + c.files.length, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <GradientBackground />
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-end gap-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">简历仓库</h1>
              <p className="mt-1 text-sm text-muted-foreground">管理你的简历版本，针对不同岗位和公司进行优化</p>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{totalFilesCount}</span>
                <span className="text-xs text-muted-foreground">份简历</span>
              </div>
              <button onClick={() => setShowNewCard(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary font-medium hover:bg-primary/20 transition-colors"><Upload className="h-4 w-4" />上传</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:border-primary transition-all">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input type="text" placeholder="搜索岗位类型、公司名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-5">
          <button onClick={() => setFilterType('全部')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === '全部' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>全部</button>
          {POSITION_TYPES.map((p) => (<button key={p.name} onClick={() => setFilterType(p.name)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === p.name ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>{p.abbr}</button>))}
        </div>
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (<ResumeCardItem key={card.id} card={card} onEdit={() => setEditingCard(card)} onPreview={() => setPreviewingCard(card)} onDelete={() => handleDelete(card.id)} />))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><FileText className="h-8 w-8 text-muted-foreground" /></div>
            <p className="text-base text-muted-foreground mb-2">暂无简历组件</p>
            <p className="text-sm text-muted-foreground">点击"上传"开始管理你的简历版本</p>
          </div>
        )}
      </div>
      <NewCardDialog open={showNewCard} onClose={() => setShowNewCard(false)} onCreated={refreshCards} />
      <EditDialog open={!!editingCard} onClose={() => setEditingCard(null)} card={editingCard} onSaved={refreshCards} />
      <VersionHistoryDialog open={!!previewingCard} onClose={() => setPreviewingCard(null)} card={previewingCard} />
    </div>
  );
}
