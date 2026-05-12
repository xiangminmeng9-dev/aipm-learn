'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, SlidersHorizontal, ChevronDown, Trash2, Pencil,
  Eye, Clock, CheckCircle2, XCircle, Briefcase, Building2, MapPin, Calendar, X,
  Send, FileText, PhoneCall, Award,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────
type KanbanStage = 'watching' | 'applied' | 'exam' | 'oc' | 'interviewing' | 'offer' | 'accepted' | 'rejected';
type AppStatus   = '观望' | '已投递' | '笔/面试' | 'OC' | '面试中' | 'Offer' | '已接受' | '已拒绝';
type TimeFilter  = 'all' | 'week' | 'month';

interface AppRecord {
  id: string;
  company:     string;
  position:    string;
  stage:       KanbanStage;
  status:      AppStatus;
  match:       number;
  source:      string;
  city:        string;
  appliedAt:   string;
  updatedAt:   string;
  tags:        string[];
  notes:       string;
  interviewTime?: string; // 面试时间，格式 "HH:mm"
  interviewDate?: string; // 面试日期，格式 "YYYY-MM-DD"
}

// ── Kanban stage config ─────────────────────────────────
const KANBAN_STAGES: { key: KanbanStage; label: AppStatus; icon: React.ElementType; color: string; iconColor: string }[] = [
  { key:'watching',     label:'观望',   icon: Eye,          color:'#64748B', iconColor:'#94A3B8' },
  { key:'applied',      label:'已投递', icon: Briefcase,    color:'#64748B', iconColor:'#94A3B8' },
  { key:'exam',         label:'笔/面试',icon: FileText,     color:'#F59E0B', iconColor:'#FBBF24' },
  { key:'oc',           label:'OC',     icon: PhoneCall,    color:'#A78BFA', iconColor:'#C4B5FD' },
  { key:'interviewing', label:'面试中', icon: Clock,        color:'#818CF8', iconColor:'#A5B4FC' },
  { key:'offer',        label:'Offer',  icon: Award,        color:'#34D399', iconColor:'#6EE7B7' },
  { key:'accepted',     label:'已接受', icon: CheckCircle2, color:'#22C55E', iconColor:'#4ADE80' },
  { key:'rejected',     label:'已拒绝', icon: XCircle,      color:'#F87171', iconColor:'#FCA5A5' },
];

// ── Right table columns ─────────────────────────────────
const EDIT_COLS = [
  { key:'company',   label:'公司',     pct:'16%' },
  { key:'position',  label:'职位',     pct:'18%' },
  { key:'match',     label:'匹配度',   pct:'13%' },
  { key:'status',    label:'状态',     pct:'11%' },
  { key:'source',    label:'渠道',     pct:'11%' },
  { key:'city',      label:'城市',     pct:'10%' },
  { key:'appliedAt', label:'投递时间', pct:'13%' },
];

const ALL_STATUSES: AppStatus[] = ['观望','已投递','笔/面试','OC','面试中','Offer','已接受','已拒绝'];
const ALL_SOURCES = ['Boss直聘','官网','内推','LinkedIn','脉脉','猎头','其他'];

// Interview statuses that show time input
const INTERVIEW_STATUSES: AppStatus[] = ['笔/面试', 'OC', '面试中'];

// ── Status badge ────────────────────────────────────────
const statusStyle: Record<AppStatus, string> = {
  '观望':   'text-muted-foreground bg-muted/50 border-border',
  '已投递': 'text-muted-foreground bg-muted/50 border-border',
  '笔/面试':'text-[#FBBF24] bg-[#F59E0B]/10 border-[#F59E0B]/20',
  'OC':     'text-[#C4B5FD] bg-[#8B5CF6]/10 border-[#8B5CF6]/20',
  '面试中': 'text-[#A5B4FC] bg-[#818CF8]/10 border-[#818CF8]/20',
  'Offer':  'text-[#6EE7B7] bg-[#34D399]/10 border-[#34D399]/20',
  '已接受': 'text-[#4ADE80] bg-[#22C55E]/10 border-[#22C55E]/20',
  '已拒绝': 'text-[#FCA5A5] bg-[#F87171]/10 border-[#F87171]/20',
};

function StatusBadge({ status }: { status: AppStatus }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-3 py-1 text-[15px] font-medium ${statusStyle[status]}`}>{status}</span>
  );
}

// ── Match cell - simple text like other cells ───────────────────────────────────────────
function MatchCell({ value, editable, onChange }: { value:number; editable?:boolean; onChange?:(v:number)=>void }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{if(edit)ref.current?.focus();},[edit]);
  useEffect(()=>{setDraft(String(value));},[value]);
  const commit = () => {
    setEdit(false);
    const num = parseInt(draft) || 0;
    const clamped = Math.max(0, Math.min(100, num));
    if(clamped !== value && onChange) onChange(clamped);
  };
  if (edit) return (
    <input ref={ref} type="number" min={0} max={100}
      className="w-full rounded border border-[#7C3AED]/30 bg-muted px-2 py-1.5 text-[15px] font-medium text-foreground outline-none"
      value={draft} onChange={(e)=>setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e)=>{if(e.key==='Enter')commit();if(e.key==='Escape'){setDraft(String(value));setEdit(false);}}} />
  );
  return (
    <button className="w-full text-left px-1 py-1 rounded text-[15px] font-medium text-foreground hover:bg-muted/50 cursor-text transition-colors"
      onClick={()=>setEdit(true)}>{value}%</button>
  );
}

// ── Empty input row: Excel-style direct typing ──────────
function EmptyInputRow({ onSave, onFocus }: { onSave:(r:AppRecord)=>void; onFocus:()=>void }) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [match, setMatch] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [city, setCity] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [committed, setCommitted] = useState(false);

  const submit = () => {
    const c = company.trim(); const p = position.trim();
    if (!c || !p) return;
    const stageDef = KANBAN_STAGES.find(s=>s.label===status);
    onSave({
      id: Date.now().toString(),
      company: c, position: p,
      stage: stageDef?.key||'applied',
      status: (status as AppStatus)||'已投递',
      match: parseInt(match)||0,
      source: source||'Boss直聘',
      city: city.trim(),
      appliedAt: appliedAt||new Date().toISOString().slice(0,10),
      updatedAt: '刚刚', tags: [], notes: '',
    });
    setCommitted(true);
  };

  if (committed) return null;

  const cellCls = "w-full bg-transparent text-[15px] text-foreground outline-none py-2.5 px-1 rounded hover:bg-muted/50 focus:bg-muted focus:text-foreground transition-colors placeholder:text-muted-foreground";

  return (
    <tr className="border-b border-border">
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="公司" value={company}
          onChange={(e)=>{setCompany(e.target.value);onFocus();}}
          onBlur={()=>{if(company.trim()&&position.trim())submit();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="职位" value={position}
          onChange={(e)=>{setPosition(e.target.value);onFocus();}}
          onBlur={()=>{if(company.trim()&&position.trim())submit();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="匹配度" value={match} type="number" min={0} max={100}
          onChange={(e)=>{setMatch(e.target.value);onFocus();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="状态" value={status}
          onChange={(e)=>{setStatus(e.target.value);onFocus();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="渠道" value={source}
          onChange={(e)=>{setSource(e.target.value);onFocus();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="城市" value={city}
          onChange={(e)=>{setCity(e.target.value);onFocus();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-3">
        <input className={cellCls} placeholder="日期" value={appliedAt}
          onChange={(e)=>{setAppliedAt(e.target.value);onFocus();}}
          onKeyDown={(e)=>{if(e.key==='Enter'&&company.trim()&&position.trim())submit();}} />
      </td>
      <td className="py-0.5 px-1" />
    </tr>
  );
}

// ── Inline editable cells ───────────────────────────────
function InlineCell({ value, onSave, placeholder }: { value:string; onSave:(v:string)=>void; placeholder?:string }) {
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(()=>{if(edit)ref.current?.focus();},[edit]);
  useEffect(()=>{setDraft(value);},[value]);
  const commit = () => { setEdit(false); if(draft!==value) onSave(draft); };
  if (edit) return (
    <input ref={ref} className="w-full rounded border-2 border-[#7C3AED]/30 bg-muted px-2 py-1.5 text-[15px] font-medium text-foreground outline-none" value={draft}
      onChange={(e)=>setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e)=>{if(e.key==='Enter')commit();if(e.key==='Escape'){setDraft(value);setEdit(false);}}} placeholder={placeholder} />
  );
  return (
    <button className="w-full text-left px-1 py-1 rounded text-[15px] font-medium text-foreground hover:bg-muted/50 hover:text-foreground cursor-text transition-colors truncate"
      onClick={()=>setEdit(true)}>{value||<span className="text-muted-foreground italic font-normal">{placeholder||'—'}</span>}</button>
  );
}

function InlineSelectCell({ value, options, onSave }: { value:string; options:string[]; onSave:(v:string)=>void }) {
  const [edit, setEdit] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(()=>{if(edit)ref.current?.focus();},[edit]);
  const commit = (v:string) => { setEdit(false); if(v!==value) onSave(v); };
  if (edit) return (
    <select ref={ref} className="w-full rounded border-2 border-[#7C3AED]/30 bg-muted px-1 py-1.5 text-[15px] font-medium text-foreground outline-none"
      value={value} onChange={(e)=>commit(e.target.value)} onBlur={()=>setEdit(false)}>
      {options.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <button className="w-full text-left px-1 py-1 rounded text-[15px] font-medium text-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer transition-colors"
      onClick={()=>setEdit(true)}>{value||'—'}</button>
  );
}

// ── Kanban card with drag support ─────────────────────────────────────────
function KanbanCard({ record, onEdit, onDelete, onDragStart, onDragEnd }: { record:AppRecord; onEdit:(r:AppRecord)=>void; onDelete:(id:string)=>void; onDragStart:(r:AppRecord)=>void; onDragEnd:()=>void }) {
  const stageDef = KANBAN_STAGES.find(s=>s.key===record.stage);
  const showInterviewTime = INTERVIEW_STATUSES.includes(record.status) && record.interviewTime;
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', record.id); onDragStart(record); }}
      onDragEnd={onDragEnd}
      className="group/card rounded-lg border border-border bg-muted/50 hover:bg-muted hover:border-border p-4 cursor-grab active:cursor-grabbing transition-all duration-200 ease-out"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-[16px] font-medium text-foreground truncate">{record.company}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
          <button onClick={(e)=>{e.stopPropagation();onEdit(record);}} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-[#A78BFA] transition-colors">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={(e)=>{e.stopPropagation();onDelete(record.id);}} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-[#F87171] transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="text-[15px] text-muted-foreground mb-3 truncate">{record.position}</p>
      {/* 面试时间显示 */}
      {showInterviewTime && (
        <div className="flex items-center gap-1.5 mb-3 text-[13px] text-[#FBBF24] bg-[#F59E0B]/10 rounded-md px-2 py-1 w-fit">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-medium">{record.interviewTime}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {record.tags.map((t) => (
            <span key={t} className="inline-block rounded-[3px] bg-muted border border-border px-2 py-0.5 text-[12px] text-muted-foreground">{t}</span>
          ))}
        </div>
        {record.city && (
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin className="h-3 w-3" />{record.city}</span>
        )}
      </div>
      {record.notes && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-[#818CF8]/60" />{record.notes}
        </div>
      )}
    </div>
  );
}

// ── Edit/Add dialog ─────────────────────────────────────
function RecordDialog({ open, onClose, onSave, editing }: {
  open:boolean; onClose:()=>void; onSave:(r:AppRecord)=>void; editing:AppRecord|null;
}) {
  const [company, setCompany] = useState(editing?.company||'');
  const [position, setPosition] = useState(editing?.position||'');
  const [stage, setStage] = useState<KanbanStage>(editing?.stage||'applied');
  const [match, setMatch] = useState(editing?.match??50);
  const [source, setSource] = useState(editing?.source||'Boss直聘');
  const [city, setCity] = useState(editing?.city||'');
  const [appliedAt, setAppliedAt] = useState(editing?.appliedAt||new Date().toISOString().slice(0,10));
  const [interviewDate, setInterviewDate] = useState(editing?.interviewDate||'');
  const [interviewTime, setInterviewTime] = useState(editing?.interviewTime||'');
  const [tags, setTags] = useState(editing?.tags.join(',')||'');
  const [notes, setNotes] = useState(editing?.notes||'');
  const companyRef = useRef<HTMLInputElement>(null);
  const isEdit = !!editing;

  // 计算当前阶段是否为面试状态
  const currentStageDef = KANBAN_STAGES.find(s=>s.key===stage);
  const showInterviewTime = currentStageDef && INTERVIEW_STATUSES.includes(currentStageDef.label);

  useEffect(() => {
    if (open) {
      setCompany(editing?.company||'');
      setPosition(editing?.position||'');
      setStage(editing?.stage||'applied');
      setMatch(editing?.match??50);
      setSource(editing?.source||'Boss直聘');
      setCity(editing?.city||'');
      setAppliedAt(editing?.appliedAt||new Date().toISOString().slice(0,10));
      // 如果没有面试日期，默认使用投递日期
      setInterviewDate(editing?.interviewDate || editing?.appliedAt || '');
      setInterviewTime(editing?.interviewTime||'');
      setTags(editing?.tags.join(',')||'');
      setNotes(editing?.notes||'');
      setTimeout(()=>companyRef.current?.focus(),50);
    }
  }, [open, editing]);

  if (!open) return null;

  const submit = () => {
    if (!company.trim() || !position.trim()) return;
    const submitStageDef = KANBAN_STAGES.find(s=>s.key===stage)!;
    const isInterviewStatus = INTERVIEW_STATUSES.includes(submitStageDef.label);
    const finalInterviewDate = isInterviewStatus ? (interviewDate || appliedAt) : undefined;
    const finalInterviewTime = isInterviewStatus ? interviewTime : undefined;

    console.log('Saving record:', {
      stage,
      status: submitStageDef.label,
      isInterviewStatus,
      interviewDate: finalInterviewDate,
      interviewTime: finalInterviewTime,
    });

    onSave({
      id: editing?.id || Date.now().toString(),
      company: company.trim(), position: position.trim(),
      stage, status: submitStageDef.label, match, source, city: city.trim(),
      appliedAt, updatedAt: isEdit ? editing!.updatedAt : '刚刚',
      interviewDate: finalInterviewDate,
      interviewTime: finalInterviewTime,
      tags: tags.split(/[,，]/).map(t=>t.trim()).filter(Boolean),
      notes: notes.trim(),
    });
    onClose();
  };

  const inputCls = "w-full rounded-lg border-2 border-border bg-muted px-3 py-2.5 text-[16px] font-medium text-foreground outline-none focus:border-[#7C3AED]/40 focus:shadow-[0_0_12px_rgba(124,58,237,0.08)] transition-all placeholder:text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-xl border-2 border-border bg-card shadow-2xl shadow-black/50 w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[18px] font-bold text-foreground">{isEdit?'编辑投递':'新增投递'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-muted-foreground transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div><label className="block text-[14px] font-medium text-muted-foreground mb-1.5">公司 *</label><input ref={companyRef} className={inputCls} placeholder="公司名" value={company} onChange={(e)=>setCompany(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&submit()} /></div>
          <div><label className="block text-[14px] font-medium text-muted-foreground mb-1.5">职位 *</label><input className={inputCls} placeholder="职位名" value={position} onChange={(e)=>setPosition(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&submit()} /></div>
          <div><label className="block text-[14px] font-medium text-muted-foreground mb-1.5">阶段</label>
            <select className={inputCls} value={stage} onChange={(e)=>setStage(e.target.value as KanbanStage)}>
              {KANBAN_STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div><label className="block text-[14px] font-medium text-muted-foreground mb-1.5">匹配度</label>
            <div className="flex items-center gap-2"><input type="range" min={0} max={100} value={match} onChange={(e)=>setMatch(Number(e.target.value))} className="flex-1 accent-[#7C3AED]" /><span className="text-[16px] font-semibold text-foreground w-10 tabular-nums">{match}%</span></div>
          </div>
          {/* 面试日期和时间 - 仅在面试相关状态时显示 */}
          {showInterviewTime && (
            <>
              <div className="col-span-2">
                <label className="block text-[14px] font-medium text-muted-foreground mb-1.5">面试日期</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FBBF24]" />
                  <input type="date" className={inputCls} value={interviewDate} onChange={(e)=>setInterviewDate(e.target.value)} />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[14px] font-medium text-muted-foreground mb-1.5">面试时间</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#FBBF24]" />
                  <input type="time" className={inputCls} value={interviewTime} onChange={(e)=>setInterviewTime(e.target.value)} />
                  {interviewTime && <span className="text-[14px] font-medium text-muted-foreground">{interviewTime}</span>}
                </div>
              </div>
            </>
          )}
          <div><label className="block text-[14px] font-medium text-muted-foreground mb-1.5">渠道</label>
            <select className={inputCls} value={source} onChange={(e)=>setSource(e.target.value)}>{ALL_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div><label className="block text-[14px] text-muted-foreground mb-1.5">城市</label><input className={inputCls} placeholder="如 北京" value={city} onChange={(e)=>setCity(e.target.value)} /></div>
          <div><label className="block text-[14px] text-muted-foreground mb-1.5">投递日期</label><input type="date" className={inputCls} value={appliedAt} onChange={(e)=>setAppliedAt(e.target.value)} /></div>
          <div><label className="block text-[14px] text-muted-foreground mb-1.5">标签</label><input className={inputCls} placeholder="AI, 电商" value={tags} onChange={(e)=>setTags(e.target.value)} /></div>
        </div>
        <div className="mt-3.5"><label className="block text-[14px] text-muted-foreground mb-1.5">备注</label><input className={inputCls} placeholder="备注信息" value={notes} onChange={(e)=>setNotes(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&submit()} /></div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-lg border border-border px-5 py-2.5 text-[16px] text-muted-foreground hover:bg-muted transition-colors">取消</button>
          <button onClick={submit} className="rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 px-5 py-2.5 text-[16px] text-[#A78BFA] font-medium transition-all shadow-[0_0_12px_rgba(124,58,237,0.08)]">确认{isEdit?'保存':'添加'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Time filter ─────────────────────────────────────────
function TimeDropdown({ value, onChange, onClose }: { value:TimeFilter; onChange:(v:TimeFilter)=>void; onClose:()=>void }) {
  const opts: { key:TimeFilter; label:string }[] = [{ key:'all',label:'全部时间' },{ key:'week',label:'近一周' },{ key:'month',label:'近一月' }];
  return (
    <div className="absolute top-full right-0 mt-1 rounded-lg border border-border bg-card shadow-xl shadow-black/40 py-1 z-30 min-w-[140px]">
      {opts.map((o)=>(
        <button key={o.key} className={`w-full text-left px-3 py-2.5 text-[15px] transition-colors hover:bg-muted ${value===o.key?'text-[#A78BFA]':'text-muted-foreground'}`}
          onClick={()=>{onChange(o.key);onClose();}}>{o.label}</button>
      ))}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────
export default function ApplicationTracker() {
  const STORAGE_KEY = 'resume_tracker_records';

  const loadFromStorage = (): AppRecord[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const saveToStorage = (data: AppRecord[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  };

  const [records, setRecords] = useState<AppRecord[]>(() => loadFromStorage());

  // Keep localStorage in sync with records
  useEffect(() => {
    saveToStorage(records);
    // 触发自定义事件通知其他页面更新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('applicationsUpdated'));
    }
  }, [records]);

  // Also try loading from API on mount and merge
  useEffect(() => {
    fetch('/api/resume/applications?limit=200')
      .then((r) => r.json())
      .then((d) => {
        if (d.applications && d.applications.length > 0) {
          const apiRecords: AppRecord[] = d.applications.map((a: Record<string,unknown>) => ({
            id: a.id as string,
            company: a.company_name as string,
            position: a.position_name as string,
            stage: (KANBAN_STAGES.find((s) => s.label === (a.status as string))?.key || 'applied') as KanbanStage,
            status: (a.status as AppStatus) || '已投递',
            match: 0,
            source: (a.channel as string) || 'Boss直聘',
            city: (a.city as string) || '',
            appliedAt: (a.applied_at as string) || '',
            updatedAt: (a.updated_at as string)?.slice(0, 10) || '',
            tags: [],
            notes: (a.notes as string) || '',
          }));
          // Merge: API records take precedence by company+position, keep local-only ones
          const localMap = new Map(loadFromStorage().map((r) => [`${r.company}|${r.position}`, r]));
          apiRecords.forEach((r) => localMap.set(`${r.company}|${r.position}`, r));
          const merged = Array.from(localMap.values());
          setRecords(merged);
        }
      })
      .catch(() => {});
  }, []);
  const [sortKey, setSortKey] = useState<string|null>(null);
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppRecord|null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [timeDropdown, setTimeDropdown] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<KanbanStage>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  // Drag and drop state
  const [draggingRecord, setDraggingRecord] = useState<AppRecord|null>(null);
  const [dragOverStage, setDragOverStage] = useState<KanbanStage|null>(null);
  const timeFiltered = useMemo(() => {
    if (timeFilter==='all') return records;
    const now = new Date(); const cutoff = new Date();
    if (timeFilter==='week') cutoff.setDate(now.getDate()-7);
    else cutoff.setDate(now.getDate()-30);
    return records.filter((r)=>new Date(r.appliedAt)>=cutoff);
  }, [records, timeFilter]);

  const grouped = useMemo(() => {
    const map: Record<KanbanStage, AppRecord[]> = { watching:[], applied:[], exam:[], oc:[], interviewing:[], offer:[], accepted:[], rejected:[] };
    timeFiltered.forEach((r)=>map[r.stage].push(r));
    return map;
  }, [timeFiltered]);

  const filtered = useMemo(() => {
    let result = timeFiltered;
    if (search) { const q=search.toLowerCase(); result=result.filter((r)=>r.company.toLowerCase().includes(q)||r.position.toLowerCase().includes(q)); }
    if (filterStatus) result=result.filter((r)=>r.status===filterStatus);
    if (filterSource) result=result.filter((r)=>r.source===filterSource);
    return result;
  }, [timeFiltered, search, filterStatus, filterSource]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a,b)=>{
      const aVal=String((a as unknown as Record<string,unknown>)[sortKey]??'');
      const bVal=String((b as unknown as Record<string,unknown>)[sortKey]??'');
      const cmp=aVal.localeCompare(bVal,'zh-CN');
      return sortDir==='asc'?cmp:-cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const tableBodyRef = useRef<HTMLTableSectionElement>(null!);
  const [emptyRowCount, setEmptyRowCount] = useState(20);
  const ROW_H = 46;

  useEffect(() => {
    const calc = () => {
      const el = tableBodyRef.current;
      if (!el) return;
      const container = el.parentElement;
      if (!container) return;
      const containerH = container.clientHeight;
      const theadH = (container.querySelector('thead') as HTMLElement)?.offsetHeight || 44;
      const dataRows = el.querySelectorAll('tr[data-id]').length;
      const usedH = dataRows * ROW_H + theadH;
      const availH = containerH - usedH;
      const needed = Math.max(10, Math.floor(availH / ROW_H));
      setEmptyRowCount((prev) => (Math.abs(prev - needed) > 2 ? needed : prev));
    };
    calc();
    const ro = new ResizeObserver(calc);
    const container = tableBodyRef.current?.parentElement;
    if (container) ro.observe(container);
    return () => ro.disconnect();
  }, [sorted.length, records.length]);

  const toggleSort = (key:string) => {
    if (sortKey===key) setSortDir((d)=>(d==='asc'?'desc':'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const apiPatch = async (id:string, body:Record<string,unknown>) => {
    try { await fetch(`/api/resume/applications/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); } catch {}
  };

  const upsertRecord = async (r: AppRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((x)=>x.id===r.id);
      if (idx>=0) { const next=[...prev]; next[idx]=r; return next; }
      return [...prev, r];
    });
    // Persist to DB
    const body = { company_name:r.company, position_name:r.position, channel:r.source||'Boss直聘', status:r.status, applied_at:r.appliedAt, city:r.city||null, notes:r.notes||null };
    const idx = records.findIndex((x)=>x.id===r.id);
    if (idx>=0) {
      apiPatch(r.id, body);
    } else {
      try { await fetch('/api/resume/applications', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); } catch {}
    }
  };

  const deleteRecord = (id: string) => {
    setRecords((prev)=>prev.filter((r)=>r.id!==id));
    try { fetch(`/api/resume/applications/${id}`, { method:'DELETE' }); } catch {}
  };

  const updateField = (id:string, field:string, value:string|number) => {
    setRecords((prev)=>prev.map((r)=>{
      if (r.id!==id) return r;
      const updated = {...r, [field]:value};
      if (field==='status') {
        const s = KANBAN_STAGES.find(k=>k.label===value);
        if (s) updated.stage = s.key;
      }
      return updated;
    }));
    // Persist
    const apiField = field==='company'?'company_name':field==='position'?'position_name':field==='source'?'channel':field==='appliedAt'?'applied_at':field==='match'?null:field;
    if (apiField) {
      apiPatch(id, { [apiField]: field==='city'&&!value?null:value });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (record: AppRecord) => {
    setDraggingRecord(record);
  };

  const handleDragEnd = () => {
    setDraggingRecord(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('text/plain');
    if (!recordId) return;

    const stageDef = KANBAN_STAGES.find(s => s.key === targetStage);
    if (!stageDef) return;

    // Update the record's stage and status, preserving interview data
    setRecords((prev) => prev.map((r) => {
      if (r.id !== recordId) return r;
      // 如果拖到面试状态，保留面试日期和时间
      const isInterviewStatus = INTERVIEW_STATUSES.includes(stageDef.label);
      return {
        ...r,
        stage: targetStage,
        status: stageDef.label,
        // 如果之前没有面试日期，且拖到面试状态，使用投递日期作为默认面试日期
        interviewDate: isInterviewStatus ? (r.interviewDate || r.appliedAt) : undefined,
        interviewTime: isInterviewStatus ? r.interviewTime : undefined,
      };
    }));

    // Persist to API
    apiPatch(recordId, { status: stageDef.label });

    setDraggingRecord(null);
    setDragOverStage(null);
  };

  const total = timeFiltered.length;

  // Split stages into 2 rows: top 4, bottom 3
  const topRow = KANBAN_STAGES.slice(0,4);
  const bottomRow = KANBAN_STAGES.slice(4,7);

  return (
    <div className="h-screen flex flex-col font-sans antialiased overflow-hidden bg-background" style={{ fontFamily:'"Inter","SF Pro Display",-apple-system,sans-serif', fontWeight: 500 }}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background:'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background:'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background:'radial-gradient(circle, #818CF8 0%, transparent 70%)', transform:'translate(-50%,-50%)' }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 overflow-hidden w-full px-5 py-4">

        {/* ── Top bar ── */}
        <header className="shrink-0 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">投递工作台</h1>
            <span className="text-[13px] font-semibold text-muted-foreground bg-muted border border-border rounded-md px-2 py-0.5">BETA</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border-2 border-border bg-muted/50 px-3.5 py-2.5 focus-within:border-[#7C3AED]/40 focus-within:shadow-[0_0_12px_rgba(124,58,237,0.08)] transition-all">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input className="bg-transparent text-[16px] font-medium text-foreground outline-none w-64 placeholder:text-muted-foreground placeholder:font-normal" placeholder="搜索公司或职位..." value={search} onChange={(e)=>setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <button onClick={()=>setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 rounded-lg border-2 px-3.5 py-2.5 text-[15px] font-medium transition-all duration-200 ${
                  showFilters||filterStatus||filterSource?'border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#A78BFA]':'border-border bg-muted/50 hover:bg-muted hover:border-border text-muted-foreground'}`}>
                <SlidersHorizontal className="h-5 w-5" />筛选
                {(filterStatus||filterSource)&&<span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-[#7C3AED]/40 text-foreground text-[10px] font-semibold px-1">!</span>}
              </button>
              {showFilters&&(
                <div className="absolute top-full right-0 mt-1 rounded-lg border-2 border-border bg-card shadow-xl shadow-black/40 p-4 z-30 min-w-[200px] space-y-3.5">
                  <div><label className="block text-[13px] font-medium text-muted-foreground mb-1.5">状态</label>
                    <select className="w-full rounded-md border-2 border-border bg-muted px-2.5 py-2 text-[15px] font-medium text-foreground outline-none" value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
                      <option value="">全部</option>{ALL_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-[13px] font-medium text-muted-foreground mb-1.5">渠道</label>
                    <select className="w-full rounded-md border-2 border-border bg-muted px-2.5 py-2 text-[15px] font-medium text-foreground outline-none" value={filterSource} onChange={(e)=>setFilterSource(e.target.value)}>
                      <option value="">全部</option>{ALL_SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {(filterStatus||filterSource)&&<button className="w-full text-[13px] font-medium text-muted-foreground hover:text-[#F87171] transition-colors" onClick={()=>{setFilterStatus('');setFilterSource('');}}>清除筛选</button>}
                </div>
              )}
            </div>
            <button onClick={()=>{setEditing(null);setDialogOpen(true);}}
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#7C3AED]/30 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/15 hover:border-[#7C3AED]/50 text-[15px] text-[#A78BFA] px-5 py-2.5 font-semibold transition-all duration-200 shadow-[0_0_12px_rgba(124,58,237,0.06)]">
              <Plus className="h-5 w-5" />新增投递
            </button>
          </div>
        </header>

        {/* ── Two-column body ── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0">

          {/* ===== LEFT: Kanban ===== */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="shrink-0 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] font-bold text-foreground">投递看板</h2>
                <span className="text-[14px] font-medium text-muted-foreground">{total} cards</span>
              </div>
              <div className="relative">
                <button onClick={()=>setTimeDropdown(!timeDropdown)}
                  className="flex items-center gap-1.5 text-[15px] font-medium text-muted-foreground hover:text-muted-foreground transition-colors px-2 py-1 rounded hover:bg-muted">
                  <ChevronDown className="h-4 w-4" />{timeFilter==='all'?'全部时间':timeFilter==='week'?'近一周':'近一月'}
                </button>
                {timeDropdown&&<TimeDropdown value={timeFilter} onChange={setTimeFilter} onClose={()=>setTimeDropdown(false)} />}
              </div>
            </div>

            {/* Kanban: 2 rows */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Top row: 4 columns */}
              <div className="flex-1 grid grid-cols-4 gap-3 min-h-0">
                {topRow.map((stage)=>{
                  const isCollapsed=collapsed.has(stage.key);
                  const isDragOver=dragOverStage===stage.key;
                  const toggle=()=>{setCollapsed((prev)=>{const n=new Set(prev);if(n.has(stage.key))n.delete(stage.key);else n.add(stage.key);return n;});};
                  return (
                    <div key={stage.key} className="flex flex-col min-h-0"
                      onDragOver={(e)=>handleDragOver(e,stage.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e)=>handleDrop(e,stage.key)}
                    >
                      <button onClick={toggle}
                        className="shrink-0 flex items-center justify-between mb-2 px-1.5 py-1.5 rounded hover:bg-muted transition-colors cursor-pointer group/header">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground group-hover/header:text-muted-foreground transition-transform duration-200 ${isCollapsed?'-rotate-90':''}`} />
                          <stage.icon className="h-4 w-4" style={{color:stage.iconColor}} />
                          <span className="text-[15px] font-medium text-muted-foreground">{stage.label}</span>
                          <span className="text-[15px] font-semibold text-foreground tabular-nums">{grouped[stage.key].length}</span>
                        </div>
                        <span onClick={(e)=>{e.stopPropagation();setEditing(null);setDialogOpen(true);}} className="text-muted-foreground hover:text-muted-foreground transition-colors opacity-0 group-hover/header:opacity-100 cursor-pointer">
                          <Plus className="h-4 w-4" />
                        </span>
                      </button>
                      {!isCollapsed&&(
                        <div className={`flex-1 space-y-2 overflow-y-auto pr-0.5 pb-2 rounded-lg transition-colors ${isDragOver?'bg-[#7C3AED]/10 border-2 border-dashed border-[#7C3AED]/40':''}`}>
                          {grouped[stage.key].map((r)=>(<KanbanCard key={r.id} record={r} onEdit={(rec)=>{setEditing(rec);setDialogOpen(true);}} onDelete={deleteRecord} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />))}
                          {grouped[stage.key].length===0&&<div className="rounded-lg border border-dashed border-border py-8 px-3 text-center"><p className="text-[15px] text-muted-foreground">拖拽卡片至此</p></div>}
                        </div>
                      )}
                      {isCollapsed&&<div className="flex-1 min-h-0" />}
                    </div>
                  );
                })}
              </div>
              {/* Bottom row: 3 columns */}
              <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
                {bottomRow.map((stage)=>{
                  const isCollapsed=collapsed.has(stage.key);
                  const isDragOver=dragOverStage===stage.key;
                  const toggle=()=>{setCollapsed((prev)=>{const n=new Set(prev);if(n.has(stage.key))n.delete(stage.key);else n.add(stage.key);return n;});};
                  return (
                    <div key={stage.key} className="flex flex-col min-h-0"
                      onDragOver={(e)=>handleDragOver(e,stage.key)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e)=>handleDrop(e,stage.key)}
                    >
                      <button onClick={toggle}
                        className="shrink-0 flex items-center justify-between mb-2 px-1.5 py-1.5 rounded hover:bg-muted transition-colors cursor-pointer group/header">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground group-hover/header:text-muted-foreground transition-transform duration-200 ${isCollapsed?'-rotate-90':''}`} />
                          <stage.icon className="h-4 w-4" style={{color:stage.iconColor}} />
                          <span className="text-[15px] font-medium text-muted-foreground">{stage.label}</span>
                          <span className="text-[15px] font-semibold text-foreground tabular-nums">{grouped[stage.key].length}</span>
                        </div>
                        <span onClick={(e)=>{e.stopPropagation();setEditing(null);setDialogOpen(true);}} className="text-muted-foreground hover:text-muted-foreground transition-colors opacity-0 group-hover/header:opacity-100 cursor-pointer">
                          <Plus className="h-4 w-4" />
                        </span>
                      </button>
                      {!isCollapsed&&(
                        <div className={`flex-1 space-y-2 overflow-y-auto pr-0.5 pb-2 rounded-lg transition-colors ${isDragOver?'bg-[#7C3AED]/10 border-2 border-dashed border-[#7C3AED]/40':''}`}>
                          {grouped[stage.key].map((r)=>(<KanbanCard key={r.id} record={r} onEdit={(rec)=>{setEditing(rec);setDialogOpen(true);}} onDelete={deleteRecord} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />))}
                          {grouped[stage.key].length===0&&<div className="rounded-lg border border-dashed border-border py-8 px-3 text-center"><p className="text-[15px] text-muted-foreground">拖拽卡片至此</p></div>}
                        </div>
                      )}
                      {isCollapsed&&<div className="flex-1 min-h-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Inline-editable table ===== */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex-1 rounded-xl border-2 border-border bg-muted/30 overflow-hidden flex flex-col min-h-0">
              <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b-2 border-border">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[18px] font-bold text-foreground">全部记录</h2>
                  <span className="text-[13px] font-semibold text-muted-foreground bg-muted rounded-md px-2 py-0.5 tabular-nums">{filtered.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button onClick={()=>{const next=sortKey?null:'appliedAt';toggleSort(next||'appliedAt');if(!sortKey)setSortKey('appliedAt');}}
                      className={`flex items-center gap-1 text-[14px] font-medium transition-colors px-2 py-1 rounded ${sortKey?'text-[#A78BFA] bg-[#7C3AED]/10':'text-muted-foreground hover:text-muted-foreground hover:bg-muted'}`}>
                      <SlidersHorizontal className="h-4 w-4" />
                      {sortKey ? `${sortKey==='appliedAt'?'投递时间':sortKey==='company'?'公司':'匹配度'} ${sortDir==='asc'?'↑':'↓'}` : '排序'}
                    </button>
                    {sortKey && (
                      <button className="text-[12px] font-medium text-muted-foreground hover:text-[#F87171] transition-colors ml-1" onClick={()=>{setSortKey(null);setSortDir('asc');}}>清除</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b-2 border-border sticky top-0 bg-card/95 backdrop-blur-sm">
                      {EDIT_COLS.map((col)=>(
                        <th key={col.key} className="h-[44px] px-3 text-left text-[13px] font-semibold text-muted-foreground uppercase tracking-wider select-none cursor-pointer hover:text-muted-foreground transition-colors"
                          style={{width:col.pct}} onClick={()=>toggleSort(col.key)}>
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            {sortKey===col.key&&<ChevronDown className={`h-3.5 w-3.5 text-[#818CF8] transition-transform duration-200 ${sortDir==='asc'?'rotate-180':''}`} />}
                          </span>
                        </th>
                      ))}
                      <th className="w-10 h-[44px] px-1" />
                    </tr>
                  </thead>
                  <tbody ref={tableBodyRef}>
                    {sorted.map((r)=>(
                        <tr key={r.id} data-id={r.id} className="border-b border-border hover:bg-muted transition-colors duration-150 group">
                          <td className="py-3 px-3"><InlineCell value={r.company} onSave={(v)=>updateField(r.id,'company',v)} placeholder="公司名" /></td>
                          <td className="py-3 px-3"><InlineCell value={r.position} onSave={(v)=>updateField(r.id,'position',v)} placeholder="职位名" /></td>
                          <td className="py-3 px-3"><MatchCell value={r.match} editable onChange={(v)=>updateField(r.id,'match',v)} /></td>
                          <td className="py-3 px-3">
                            <InlineSelectCell value={r.status} options={ALL_STATUSES} onSave={(v)=>updateField(r.id,'status',v)} />
                          </td>
                          <td className="py-3 px-3"><InlineSelectCell value={r.source} options={ALL_SOURCES} onSave={(v)=>updateField(r.id,'source',v)} /></td>
                          <td className="py-3 px-3"><InlineCell value={r.city} onSave={(v)=>updateField(r.id,'city',v)} placeholder="城市" /></td>
                          <td className="py-3 px-3"><InlineCell value={r.appliedAt} onSave={(v)=>updateField(r.id,'appliedAt',v)} placeholder="日期" /></td>
                          <td className="py-3 px-1">
                            <button onClick={()=>deleteRecord(r.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-[#F87171] transition-all duration-150">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                    ))}
                    {/* ── Empty input rows: fill remaining height ── */}
                    {Array.from({ length: emptyRowCount }).map((_, i) => (
                      <EmptyInputRow key={`empty-${i}`} onSave={upsertRecord} onFocus={()=>{}} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecordDialog open={dialogOpen} onClose={()=>{setDialogOpen(false);setEditing(null);}} onSave={upsertRecord} editing={editing} />
    </div>
  );
}
