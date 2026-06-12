'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, MotionDiv } from '@/components/ui/lazy-motion';
import type { MapNode, Topic, MustRead, CaseStudy, InterviewQ } from './map-data';

// ─── Dynamic Data Loading ────────────────────────────────────────────

// Lazy-load the 237KB map data only when this page is visited
let _mapData: { NODES: MapNode[]; REGIONS: { id: string; name: string; color: string }[] } | null = null;
async function loadMapData() {
  if (!_mapData) {
    const mod = await import('./map-data');
    _mapData = { NODES: mod.NODES, REGIONS: mod.REGIONS };
  }
  return _mapData;
}


// NODES and REGIONS are dynamically loaded via loadMapData()


const LEARNING_PATHS = [
  {
    id: 'product-first',
    name: '产品优先',
    color: '#34c759',
    nodes: ['learning-resources', 'pm-capability', 'pm-thinking', 'user-research', 'product-design', 'ai-requirement-spec', 'ai-commercialization', 'ai-growth', 'data-metrics', 'ai-evaluation', 'badcase-analysis', 'product-strategy', 'hitl-design', 'content-compliance', 'ai-leadership', 'job-preparation'],
  },
  {
    id: 'ai-first',
    name: 'AI 技术优先',
    color: '#ff9500',
    nodes: ['learning-resources', 'ai-fundamentals', 'ai-frontier', 'ai-agent-design', 'prompt-engineering', 'rag-architecture', 'ai-workflow', 'ai-evaluation', 'ai-architecture', 'ai-safety', 'cn-llm-ecosystem', 'ai-vendor-evaluation', 'product-design', 'ai-leadership', 'job-preparation'],
  },
  {
    id: 'balanced',
    name: '均衡发展',
    color: '#af52de',
    nodes: ['learning-resources', 'pm-capability', 'pm-thinking', 'user-research', 'product-design', 'ai-requirement-spec', 'ai-fundamentals', 'ai-frontier', 'ai-agent-design', 'prompt-engineering', 'rag-architecture', 'ai-commercialization', 'ai-growth', 'data-metrics', 'data-quality-annotation', 'data-flywheel', 'ai-workflow', 'ai-evaluation', 'badcase-analysis', 'ai-architecture', 'ai-safety', 'cn-llm-ecosystem', 'ai-vendor-evaluation', 'product-strategy', 'hitl-design', 'content-compliance', 'ai-leadership', 'job-practice', 'job-preparation'],
  },
];

// ─── Component ──────────────────────────────────────────────────────

export default function LearningMapPage() {
  const [mapData, setMapData] = useState<{ NODES: MapNode[]; REGIONS: { id: string; name: string; color: string }[] } | null>(null);
  const [extraData, setExtraData] = useState<{
    EXTRA_TOPICS: Record<string, Topic[]>;
    EXTRA_CASES: Record<string, CaseStudy[]>;
    EXTRA_MUSTREAD: Record<string, MustRead[]>;
    EXTRA_INTERVIEWQS: Record<string, InterviewQ[]>;
    EXTRA_PITFALLS: Record<string, string[]>;
    EXTRA_KEYQUESTIONS: Record<string, string[]>;
    EXTRA_LEARNINGTIPS: Record<string, string[]>;
  } | null>(null);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'resources' | 'pitfalls'>('topics');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<'map' | string>('map');
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Load map data dynamically on mount
  useEffect(() => {
    Promise.all([
      loadMapData(),
      import('./extra-data').then(m => ({
        EXTRA_TOPICS: m.EXTRA_TOPICS,
        EXTRA_CASES: m.EXTRA_CASES,
        EXTRA_MUSTREAD: m.EXTRA_MUSTREAD,
        EXTRA_INTERVIEWQS: m.EXTRA_INTERVIEWQS,
        EXTRA_PITFALLS: m.EXTRA_PITFALLS,
        EXTRA_KEYQUESTIONS: m.EXTRA_KEYQUESTIONS,
        EXTRA_LEARNINGTIPS: m.EXTRA_LEARNINGTIPS,
      })),
    ]).then(([md, ed]) => {
      setMapData(md);
      setExtraData(ed);
      // Initialize node positions from loaded data
      const pos: Record<string, { x: number; y: number }> = {};
      md.NODES.forEach((n) => { pos[n.id] = { x: n.x, y: n.y }; });
      setNodePositions(pos);
    });
  }, []);

  const NODES = mapData?.NODES ?? [];
  const REGIONS = mapData?.REGIONS ?? [];

  // Merge extra data into nodes (memoized)
  const ENRICHED_NODES = useMemo(() => {
    if (!NODES.length || !extraData) return [];
    return NODES.map((n) => ({
      ...n,
      content: {
        ...n.content,
        topics: [...n.content.topics, ...(extraData.EXTRA_TOPICS[n.id] || [])],
        caseStudies: [...n.content.caseStudies, ...(extraData.EXTRA_CASES[n.id] || [])],
        mustRead: [...n.content.mustRead, ...(extraData.EXTRA_MUSTREAD[n.id] || [])],
        interviewQs: [...n.content.interviewQs, ...(extraData.EXTRA_INTERVIEWQS[n.id] || [])],
        pitfalls: [...n.content.pitfalls, ...(extraData.EXTRA_PITFALLS[n.id] || [])],
        keyQuestions: [...n.content.keyQuestions, ...(extraData.EXTRA_KEYQUESTIONS[n.id] || [])],
        learningTips: [...n.content.learningTips, ...(extraData.EXTRA_LEARNINGTIPS[n.id] || [])],
      },
    }));
  }, [NODES, extraData]);

  const node = NODES.find((n) => n.id === selectedNode);

  const isNodeInPath = useCallback(
    (nodeId: string) => {
      if (!activePath) return true;
      const path = LEARNING_PATHS.find((p) => p.id === activePath);
      return path?.nodes.includes(nodeId) ?? false;
    },
    [activePath],
  );

  const isConnectionInPath = useCallback(
    (fromId: string, toId: string) => {
      if (!activePath) return true;
      const path = LEARNING_PATHS.find((p) => p.id === activePath);
      if (!path) return true;
      const fi = path.nodes.indexOf(fromId);
      const ti = path.nodes.indexOf(toId);
      return fi !== -1 && ti !== -1 && Math.abs(fi - ti) === 1;
    },
    [activePath],
  );

  // Use native event listener for wheel (React's is passive and can't preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      setZoom((z) => Math.min(Math.max(z * delta, 0.4), 2.5));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // All hooks must be declared before any early return to maintain consistent call order
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragTarget('map');
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      setHasMoved(true);
    }
    if (dragTarget === 'map') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else {
      // Dragging a node — use incremental movement
      const nodeId = dragTarget;
      setNodePositions((prev) => {
        const n = NODES.find((n) => n.id === nodeId);
        if (!n) return prev;
        const curPos = prev[nodeId] || { x: n.x, y: n.y };
        return {
          ...prev,
          [nodeId]: {
            x: curPos.x + dx / zoom,
            y: curPos.y + dy / zoom,
          },
        };
      });
    }
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, dragTarget, lastMouse, zoom, NODES]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragTarget('map');
    setTimeout(() => setHasMoved(false), 10);
  }, []);

  // Start dragging a node
  const handleNodeDragStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragTarget(nodeId);
    setLastMouse({ x: e.clientX, y: e.clientY });
  }, []);

  // Reset node positions to original
  const resetLayout = useCallback(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    NODES.forEach((n) => { pos[n.id] = { x: n.x, y: n.y }; });
    setNodePositions(pos);
  }, [NODES]);

  // Show loading state while data loads
  if (!mapData) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载学习地图...</p>
        </div>
      </div>
    );
  }

  const SVG_BASE_W = 1100;
  const SVG_BASE_H = 700;

  // Dynamic SVG size based on node positions
  const svgW = Math.max(SVG_BASE_W, ...Object.values(nodePositions).map((p) => p.x + 100));
  const svgH = Math.max(SVG_BASE_H, ...Object.values(nodePositions).map((p) => p.y + 100));

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-foreground">AI PM 学习地图</h1>
          <span className="text-xs text-muted-foreground">14 个知识领域 · 拖拽平移 · 滚轮缩放 · 点击节点查看详情</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActivePath(null)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                !activePath ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              全部
            </button>
            {LEARNING_PATHS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePath(activePath === p.id ? null : p.id)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  activePath === p.id ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: activePath === p.id ? p.color + '15' : 'transparent',
                  color: activePath === p.id ? p.color : 'var(--muted-foreground)',
                  border: activePath === p.id ? `1px solid ${p.color}40` : '1px solid transparent',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <button onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">+</button>
          <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(z * 0.8, 0.4))} className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">重置视图</button>
          <button onClick={resetLayout} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">重置布局</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            <svg
              width={svgW}
              height={svgH}
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="block"
            >
            <g>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.06" />
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect width={svgW} height={svgH} fill="var(--background)" />
              <rect width={svgW} height={svgH} fill="url(#grid)" />

              {/* Region labels */}
              {REGIONS.map((r) => {
                const regionNodes = NODES.filter((n) => n.region === r.id);
                const cx = regionNodes.reduce((s, n) => s + (nodePositions[n.id]?.x || n.x), 0) / regionNodes.length;
                const cy = regionNodes.reduce((s, n) => s + (nodePositions[n.id]?.y || n.y), 0) / regionNodes.length;
                return (
                  <text key={r.id} x={cx} y={cy - 70} textAnchor="middle" fontSize={16} fontWeight={800} fill={r.color} opacity={0.07}>
                    {r.name}
                  </text>
                );
              })}

              {/* Connections */}
              {NODES.flatMap((n) =>
                n.connections.map((targetId) => {
                  const target = NODES.find((t) => t.id === targetId);
                  if (!target) return null;
                  const fromPos = nodePositions[n.id] || { x: n.x, y: n.y };
                  const toPos = nodePositions[targetId] || { x: target.x, y: target.y };
                  const inPath = isConnectionInPath(n.id, targetId);
                  const bothInPath = isNodeInPath(n.id) && isNodeInPath(targetId);
                  const dx = toPos.x - fromPos.x;
                  const dy = toPos.y - fromPos.y;
                  const d = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + dx * 0.4} ${fromPos.y}, ${toPos.x - dx * 0.4} ${toPos.y}, ${toPos.x} ${toPos.y}`;
                  return (
                    <g key={`${n.id}-${targetId}`}>
                      <path d={d} fill="none" stroke={n.color} strokeWidth={2.5} strokeLinecap="round" opacity={inPath && bothInPath ? 0.2 : 0.05} />
                      {activePath && inPath && bothInPath && (
                        <path d={d} fill="none" stroke={n.color} strokeWidth={2} strokeLinecap="round" strokeDasharray="6 8" opacity={0.5}>
                          <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2s" repeatCount="indefinite" />
                        </path>
                      )}
                    </g>
                  );
                })
              )}

              {/* Nodes */}
              {NODES.map((n) => {
                const pos = nodePositions[n.id] || { x: n.x, y: n.y };
                const inPath = isNodeInPath(n.id);
                const isSelected = selectedNode === n.id;
                const isHovered = hoveredNode === n.id;
                return (
                  <g
                    key={n.id}
                    style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
                    opacity={inPath ? 1 : 0.12}
                    onClick={() => { if (hasMoved) return; setSelectedNode(isSelected ? null : n.id); setActiveTab('topics'); }}
                    onMouseDown={(e) => handleNodeDragStart(e, n.id)}
                    onMouseEnter={() => setHoveredNode(n.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {(isSelected || isHovered) && <circle cx={pos.x} cy={pos.y} r={42} fill={n.color} opacity={0.08} filter="url(#glow)" />}
                    <circle cx={pos.x} cy={pos.y} r={32} fill="var(--card)" stroke={n.color} strokeWidth={isSelected ? 3 : 2} />
                    <circle cx={pos.x} cy={pos.y} r={24} fill={isSelected ? n.color : n.color + '15'} style={{ transition: 'fill 0.2s' }} />
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={18}>{n.icon}</text>
                    <text x={pos.x} y={pos.y + 46} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--foreground)">{n.shortLabel}</text>
                    <g transform={`translate(${pos.x + 22}, ${pos.y - 22})`}>
                      <rect x={-14} y={-9} width={28} height={18} rx={9} fill={n.color} opacity={0.9} />
                      <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill="#fff">{n.content.topics.length}</text>
                    </g>
                    {isHovered && !isSelected && (
                      <g>
                        <rect x={pos.x - 90} y={pos.y - 68} width={180} height={26} rx={6} fill="var(--card)" stroke="var(--border)" strokeWidth={1} />
                        <text x={pos.x} y={pos.y - 55} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)">{n.content.summary.slice(0, 22)}...</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
            </svg>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {node && (
            <MotionDiv
              key={node.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2 }}
              className="w-full md:w-[440px] shrink-0 overflow-y-auto border-l border-border bg-card"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 border-b border-border bg-card px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: node.color + '15' }}>{node.icon}</div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{node.label}</h2>
                      <p className="text-xs text-muted-foreground">{node.content.topics.length} 个主题 · {node.content.mustRead.length} 本必读 · {node.content.caseStudies.length} 个案例</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{node.content.summary}</p>
                <div className="mt-3 flex gap-1">
                  {([
                    { key: 'topics' as const, label: '知识详解' },
                    { key: 'resources' as const, label: '必读资源' },
                    { key: 'pitfalls' as const, label: '避坑指南' },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        activeTab === tab.key ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {activeTab === 'topics' && (
                    <MotionDiv key="topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                      {node.content.topics.map((topic, i) => (
                        <div key={i}>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold" style={{ backgroundColor: node.color + '15', color: node.color }}>{i + 1}</span>
                            <h3 className="text-sm font-bold text-foreground">{topic.name}</h3>
                          </div>
                          <div className="ml-7 space-y-1.5">
                            {topic.points.map((point, j) => (
                              <div key={j} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: node.color, opacity: 0.5 }} />
                                <p className="text-xs leading-relaxed text-muted-foreground">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Key questions */}
                      <div className="rounded-xl border border-dashed border-border p-4">
                        <h4 className="mb-2 text-xs font-bold text-foreground">🎯 核心问题</h4>
                        <div className="space-y-2">
                          {node.content.keyQuestions.map((q, i) => (
                            <p key={i} className="text-xs leading-relaxed text-muted-foreground">• {q}</p>
                          ))}
                        </div>
                      </div>

                      {/* Case studies */}
                      {node.content.caseStudies.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-bold text-foreground">📋 案例研究</h4>
                          <div className="space-y-2">
                            {node.content.caseStudies.map((cs, i) => (
                              <div key={i} className="rounded-xl border border-border p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">{cs.title}</span>
                                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{cs.company}</span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cs.lesson}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interview questions */}
                      {node.content.interviewQs.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-xs font-bold text-foreground">💼 面试高频题</h4>
                          <div className="space-y-2">
                            {node.content.interviewQs.map((iq, i) => (
                              <details key={i} className="group rounded-xl border border-border">
                                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary">
                                  {iq.question}
                                </summary>
                                <div className="border-t border-border px-3 py-2">
                                  <p className="text-xs leading-relaxed text-muted-foreground">💡 {iq.hint}</p>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Learning tips */}
                      {node.content.learningTips.length > 0 && (
                        <div className="rounded-xl border border-border p-4">
                          <h4 className="mb-2 text-xs font-bold text-foreground">📝 学习建议</h4>
                          <div className="space-y-1.5">
                            {node.content.learningTips.map((tip, i) => (
                              <p key={i} className="text-xs leading-relaxed text-muted-foreground">{i + 1}. {tip}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </MotionDiv>
                  )}

                  {activeTab === 'resources' && (
                    <MotionDiv key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground">📚 必读</h4>
                      {node.content.mustRead.map((r, i) => (
                        <div key={i} className="rounded-xl border border-border p-3">
                          <p className="text-xs font-semibold text-foreground">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.author}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground/80">{r.why}</p>
                        </div>
                      ))}
                      <h4 className="mt-4 text-xs font-bold text-foreground">🛠️ 推荐工具</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {node.content.tools.map((t, i) => (
                          <span key={i} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </MotionDiv>
                  )}

                  {activeTab === 'pitfalls' && (
                    <MotionDiv key="pitfalls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                      <h4 className="text-xs font-bold text-foreground">⚠️ 常见误区</h4>
                      {node.content.pitfalls.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                          <span className="mt-0.5 text-xs text-red-500">✕</span>
                          <p className="text-xs leading-relaxed text-foreground/80">{p}</p>
                        </div>
                      ))}
                      <div className="mt-6 rounded-xl border border-border p-4">
                        <h4 className="mb-2 text-xs font-bold text-foreground">🎯 达标自检</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">能回答以下所有核心问题，说明你已经掌握了这个模块：</p>
                        <div className="mt-2 space-y-1.5">
                          {node.content.keyQuestions.map((q, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="mt-0.5 text-xs text-muted-foreground">☐</span>
                              <p className="text-xs text-muted-foreground">{q}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
