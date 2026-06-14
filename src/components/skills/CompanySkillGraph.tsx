'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactECharts from '@/components/ui/LazyECharts';
import { apiFetch } from '@/lib/api/fetch';
import { queryKnowledgeGraph } from '@/lib/skills/knowledge-graph-qa';
import type { KGNode, KGEdge } from '@/app/api/skills/knowledge-graph/route';

const TYPE_LABELS: Record<string, string> = {
  company: '公司',
  skill: '技能',
  position: '职位',
  category: '来源技能',
  module: '模块',
};

const TYPE_COLORS: Record<string, string> = {
  company: '#6366F1',
  skill: '#06B6D4',
  position: '#F59E0B',
  category: '#10B981',
  module: '#8B5CF6',
};

export default function CompanySkillGraph() {
  const [nodes, setNodes] = useState<KGNode[]>([]);
  const [edges, setEdges] = useState<KGEdge[]>([]);
  const [meta, setMeta] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Q&A state
  const [qaInput, setQaInput] = useState('');
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string; loading?: boolean }>>([]);
  const [highlightNodeIds, setHighlightNodeIds] = useState<Set<string>>(new Set());
  const [highlightEdgeIdxs, setHighlightEdgeIdxs] = useState<Set<number>>(new Set());
  const [qaLoading, setQaLoading] = useState(false);

  // Selected node detail
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);

  // Entity type filters
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(['company', 'skill', 'position', 'module']));

  // Load data
  const loadData = useCallback(async (r: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/skills/knowledge-graph?range=${r}`);
      const data = await res.json();
      if (data.nodes) setNodes(data.nodes);
      if (data.edges) setEdges(data.edges);
      if (data.meta) setMeta(data.meta);
    } catch (e) {
      console.error('Knowledge graph load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(range); }, [range, loadData]);

  // Filtered data
  const filteredNodes = useMemo(() => nodes.filter(n => visibleTypes.has(n.type)), [nodes, visibleTypes]);
  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(() => edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)), [edges, filteredNodeIds]);

  // Build ECharts option
  const chartOption = useMemo(() => {
    const echartsNodes = filteredNodes.map(n => {
      const isHighlighted = highlightNodeIds.has(n.id);
      return {
        id: n.id,
        name: n.name,
        symbolSize: n.symbolSize,
        category: ['company', 'skill', 'position', 'category', 'module'].indexOf(n.type),
        itemStyle: {
          ...n.itemStyle,
          ...(isHighlighted ? { shadowBlur: 25, shadowColor: '#FFD700', borderWidth: 3, borderColor: '#FFD700' } : {}),
        },
        label: { show: true, fontSize: 10, color: '#374151' },
        value: n.data,
      };
    });

    const echartsEdges = filteredEdges.map((e, idx) => ({
      source: e.source,
      target: e.target,
      lineStyle: {
        ...e.lineStyle,
        ...(highlightEdgeIdxs.has(idx) ? { width: e.lineStyle.width + 1, opacity: 1 } : {}),
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const d = params.data?.value || {};
            const type = TYPE_LABELS[filteredNodes.find(n => n.id === params.data?.id)?.type || ''] || '';
            let info = `<strong>${params.name}</strong> <span style="color:#9CA3AF">(${type})</span>`;
            if (d.jd_count) info += `<br/>JD分析: ${d.jd_count}个`;
            if (d.frequency) info += `<br/>出现次数: ${d.frequency}`;
            if (d.covered !== undefined) info += `<br/>${d.covered ? '✅ 已覆盖' : '⚠️ 未覆盖'}`;
            if (d.companies?.length) info += `<br/>看重公司: ${d.companies.slice(0, 3).join('、')}`;
            if (d.matched_module) info += `<br/>匹配模块: ${d.matched_module}`;
            if (d.position_jd_count) info += `<br/>JD数: ${d.position_jd_count}`;
            if (d.skill_count) info += `<br/>技能数: ${d.skill_count}`;
            return info;
          }
          if (params.dataType === 'edge') {
            const edge = filteredEdges.find((_, i) => i === params.data?.index);
            return edge ? `${edge.relation}` : '';
          }
          return '';
        },
      },
      series: [{
        type: 'graph',
        layout: 'force',
        data: echartsNodes,
        links: echartsEdges,
        categories: [
          { name: '公司', itemStyle: { color: TYPE_COLORS.company } },
          { name: '技能', itemStyle: { color: TYPE_COLORS.skill } },
          { name: '职位', itemStyle: { color: TYPE_COLORS.position } },
          { name: '类别', itemStyle: { color: TYPE_COLORS.category } },
          { name: '模块', itemStyle: { color: TYPE_COLORS.module } },
        ],
        roam: true,
        draggable: true,
        force: {
          repulsion: 250,
          gravity: 0.08,
          edgeLength: [80, 200],
          friction: 0.6,
        },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
        label: { fontSize: 10, color: '#374151' },
        lineStyle: { opacity: 0.4 },
      }],
      legend: {
        data: ['公司', '技能', '职位', '类别', '模块'],
        bottom: 0,
        textStyle: { fontSize: 11 },
      },
    };
  }, [filteredNodes, filteredEdges, highlightNodeIds, highlightEdgeIdxs]);

  // Handle Q&A submit — local highlight first, then AI answer
  const handleQASubmit = useCallback(async () => {
    if (!qaInput.trim() || qaLoading) return;

    // 1. Local highlight (instant feedback)
    const localResult = queryKnowledgeGraph(qaInput, nodes, edges);
    setHighlightNodeIds(localResult.highlights.nodeIds);
    setHighlightEdgeIdxs(localResult.highlights.edgeIndices);

    // 2. Add to history with loading state
    const idx = qaHistory.length;
    setQaHistory(prev => [...prev, { q: qaInput, a: '', loading: true }]);
    setQaInput('');
    setQaLoading(true);

    // 3. Call AI for a rich answer
    try {
      const res = await apiFetch('/api/skills/knowledge-graph/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: qaInput, nodes, edges }),
      });
      const data = await res.json();
      const answer = data.answer || data.error || '暂无回答';
      setQaHistory(prev => {
        const next = [...prev];
        next[idx] = { q: prev[idx].q, a: answer, loading: false };
        return next;
      });
    } catch {
      // Fallback to local answer
      setQaHistory(prev => {
        const next = [...prev];
        next[idx] = { q: prev[idx].q, a: localResult.answer || 'AI 调用失败，请重试', loading: false };
        return next;
      });
    } finally {
      setQaLoading(false);
    }
  }, [qaInput, qaLoading, nodes, edges, qaHistory.length]);

  // Handle node click
  const handleNodeClick = useCallback((params: any) => {
    const nodeId = params.data?.id;
    if (!nodeId) return;
    const node = nodes.find(n => n.id === nodeId);
    setSelectedNode(node || null);
  }, [nodes]);

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">技能点与公司知识图谱</h3>
          {meta && (
            <span className="text-xs text-muted-foreground">
              {meta.total_companies}家公司 · {meta.total_skills}个技能 · {meta.covered_count}已覆盖 · {meta.gap_count}未覆盖
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${range === r ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {r === '7d' ? '7天' : r === '30d' ? '30天' : '全部'}
              </button>
            ))}
          </div>
          {/* Type filters */}
          <div className="flex items-center gap-1">
            {(['company', 'skill', 'position', 'category', 'module'] as const).map(type => (
              <button
                key={type}
                onClick={() => {
                  setVisibleTypes(prev => {
                    const next = new Set(prev);
                    if (next.has(type)) next.delete(type); else next.add(type);
                    return next;
                  });
                }}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${visibleTypes.has(type) ? 'ring-1 ring-offset-1' : 'opacity-40'}`}
                style={{
                  color: visibleTypes.has(type) ? TYPE_COLORS[type] : '#9CA3AF',
                  '--tw-ring-color': TYPE_COLORS[type],
                } as React.CSSProperties}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content: Graph + Sidebar */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Graph */}
        <div className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            onEvents={{ click: (params?: unknown) => handleNodeClick(params) }}
          />
        </div>

        {/* Sidebar: Detail + Q&A */}
        <div className="w-[320px] flex flex-col gap-4 shrink-0">
          {/* Selected node detail */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">节点详情</h4>
            {selectedNode ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[selectedNode.type] }} />
                  <span className="font-semibold text-foreground">{selectedNode.name}</span>
                  <span className="text-xs text-muted-foreground">({TYPE_LABELS[selectedNode.type]})</span>
                </div>
                {Object.entries(selectedNode.data).map(([key, value]: [string, unknown]) => {
                  if (value === undefined || value === null) return null;
                  // Skip array fields — rendered separately below
                  if (Array.isArray(value)) return null;
                  const label = {
                    jd_count: 'JD分析数',
                    frequency: '出现次数',
                    covered: '已覆盖',
                    gap: '未覆盖',
                    importance_mode: '重要性',
                    matched_module: '匹配模块',
                    position_jd_count: 'JD数',
                    skill_count: '技能数',
                    module_level: '层级',
                  }[key];
                  if (!label) return null;
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">
                        {typeof value === 'boolean' ? (value ? '✅' : '❌') : String(value)}
                      </span>
                    </div>
                  );
                })}
                {Array.isArray(selectedNode.data.positions) && (selectedNode.data.positions as string[]).length > 0 && (
                  <div>
                    <span className="text-muted-foreground">关联职位：</span>
                    <span className="text-foreground">{(selectedNode.data.positions as string[]).join('、')}</span>
                  </div>
                )}
                {Array.isArray(selectedNode.data.companies) && (selectedNode.data.companies as string[]).length > 0 && (
                  <div>
                    <span className="text-muted-foreground">看重公司：</span>
                    <span className="text-foreground">{(selectedNode.data.companies as string[]).join('、')}</span>
                  </div>
                )}
                {Array.isArray(selectedNode.data.categories) && (selectedNode.data.categories as string[]).length > 0 && (
                  <div>
                    <span className="text-muted-foreground">所属类别：</span>
                    <span className="text-foreground">{(selectedNode.data.categories as string[]).join('、')}</span>
                  </div>
                )}
                {Array.isArray(selectedNode.data.sources) && (selectedNode.data.sources as string[]).length > 0 && (
                  <div className="mt-1">
                    <div className="text-muted-foreground mb-1">来源技能（{(selectedNode.data.sources as string[]).length}个）：</div>
                    <div className="flex flex-wrap gap-1">
                      {(selectedNode.data.sources as string[]).map((src, i) => (
                        <span key={i} className="inline-block px-1.5 py-0.5 text-xs rounded bg-muted text-foreground">{src}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">点击图谱中的节点查看详情</p>
            )}
          </div>

          {/* Q&A panel */}
          <div className="flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col overflow-hidden">
            <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">知识问答</h4>
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
              {qaHistory.length === 0 && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  试试这些查询：<br />
                  · 字节跳动看重什么能力<br />
                  · 哪些公司看重Agent能力<br />
                  · 产品经理需要什么技能<br />
                  · 哪些技能没有覆盖<br />
                  · 字节跳动和腾讯的共同技能
                </p>
              )}
              {qaHistory.map((item, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="text-sm font-medium text-indigo-600">❓ {item.q}</div>
                  {item.loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span>AI 思考中...</span>
                    </div>
                  ) : (
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={qaInput}
                onChange={(e) => setQaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQASubmit()}
                placeholder="输入问题..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleQASubmit}
                disabled={qaLoading}
                className={`rounded-lg px-3 py-2 text-xs font-medium text-white ${qaLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {qaLoading ? '思考中...' : '查询'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
