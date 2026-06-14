/**
 * Knowledge Graph Q&A Engine — local pattern matching + graph traversal.
 * No LLM calls — answers are derived purely from the graph data.
 * Provides instant feedback while AI generates a richer answer.
 */

import type { KGNode, KGEdge } from '@/app/api/skills/knowledge-graph/route';

interface QAResult {
  answer: string;
  highlights: {
    nodeIds: Set<string>;
    edgeIndices: Set<number>;
  };
}

// --- Pattern definitions ---

interface Pattern {
  regex: RegExp;
  handler: (match: RegExpMatchArray, nodes: KGNode[], edges: KGEdge[]) => QAResult;
}

function findNode(nodes: KGNode[], type: string, name: string): KGNode | undefined {
  return nodes.find(n => n.type === type && n.name === name);
}

function findNodeFuzzy(nodes: KGNode[], type: string, query: string): KGNode | undefined {
  const exact = findNode(nodes, type, query);
  if (exact) return exact;
  return nodes.find(n => n.type === type && n.name.includes(query));
}

function getConnectedNodes(nodeId: string, edges: KGEdge[], direction: 'out' | 'in' | 'both', relation?: string): { nodeId: string; edgeIdx: number }[] {
  const results: { nodeId: string; edgeIdx: number }[] = [];
  edges.forEach((e, idx) => {
    if (relation && e.relation !== relation) return;
    if ((direction === 'out' || direction === 'both') && e.source === nodeId) {
      results.push({ nodeId: e.target, edgeIdx: idx });
    }
    if ((direction === 'in' || direction === 'both') && e.target === nodeId) {
      results.push({ nodeId: e.source, edgeIdx: idx });
    }
  });
  return results;
}

function formatSkillRich(nodes: KGNode[], ids: string[]): string {
  return ids.map(id => {
    const n = nodes.find(x => x.id === id);
    if (!n) return '';
    const imp = n.data.importance_mode as string;
    const freq = n.data.frequency as number;
    const gap = n.data.gap as boolean;
    const impLabel = imp === 'high' ? '高' : imp === 'low' ? '低' : '中';
    const suffix = gap ? '⚠️' : '';
    return `${n.name}(${freq}次,${impLabel})${suffix}`;
  }).filter(Boolean).join('、');
}

const patterns: Pattern[] = [
  // "字节跳动看重什么能力"
  {
    regex: /(.+?)(看重|要求|需要|招聘)(什么|哪些)(能力|技能|技术|能力要求)/,
    handler: (match, nodes, edges) => {
      const companyName = match[1].trim();
      const companyNode = findNodeFuzzy(nodes, 'company', companyName);
      if (!companyNode) return { answer: `未找到公司"${companyName}"的数据`, highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      const connected = getConnectedNodes(companyNode.id, edges, 'out', '看重');
      const skillIds = connected.map(c => c.nodeId);
      const edgeIdxs = connected.map(c => c.edgeIdx);

      if (skillIds.length === 0) return { answer: `${companyName}暂无技能数据`, highlights: { nodeIds: new Set([companyNode.id]), edgeIndices: new Set() } };

      // Analyze: split into high importance vs others, find gaps
      const skillNodes = skillIds.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
      const highSkills = skillNodes.filter(n => n.data.importance_mode === 'high');
      const gapSkills = skillNodes.filter(n => n.data.gap);
      const skillList = formatSkillRich(nodes, skillIds);

      let answer = `${companyName}看重的技能有：${skillList}`;
      if (highSkills.length > 0) {
        answer += `\n\n其中核心要求（重要性高）：${highSkills.map(n => n.name).join('、')}`;
      }
      if (gapSkills.length > 0) {
        answer += `\n\n尚未覆盖的技能：${gapSkills.map(n => n.name).join('、')}`;
      }

      return {
        answer,
        highlights: { nodeIds: new Set([companyNode.id, ...skillIds]), edgeIndices: new Set(edgeIdxs) },
      };
    },
  },
  // "哪些公司看重Agent能力"
  {
    regex: /(哪些公司|哪个公司|什么公司)(看重|要求|需要|招聘)(.+)/,
    handler: (match, nodes, edges) => {
      const skillName = match[3].replace(/能力|技能|技术/g, '').trim();
      const skillNode = findNodeFuzzy(nodes, 'skill', skillName);
      if (!skillNode) return { answer: `未找到技能"${skillName}"的数据`, highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      const connected = getConnectedNodes(skillNode.id, edges, 'in', '看重');
      const companyIds = connected.map(c => c.nodeId);
      const edgeIdxs = connected.map(c => c.edgeIdx);

      if (companyIds.length === 0) return { answer: `暂无公司要求"${skillName}"`, highlights: { nodeIds: new Set([skillNode.id]), edgeIndices: new Set() } };

      const companyNames = companyIds.map(id => {
        const n = nodes.find(x => x.id === id);
        return n ? `${n.name}` : '';
      }).filter(Boolean).join('、');

      const freq = skillNode.data.frequency as number;
      const imp = (skillNode.data.importance_mode as string) === 'high' ? '高' : '中';
      const covered = skillNode.data.covered ? '已覆盖' : '⚠️未覆盖';

      return {
        answer: `看重${skillName}的公司有${companyIds.length}家：${companyNames}\n\n该技能共出现${freq}次，重要性${imp}，${covered}`,
        highlights: { nodeIds: new Set([skillNode.id, ...companyIds]), edgeIndices: new Set(edgeIdxs) },
      };
    },
  },
  // "产品经理需要什么技能"
  {
    regex: /(.+?)(职位|岗位)?(需要|要求)(什么|哪些)(技能|能力|技术)/,
    handler: (match, nodes, edges) => {
      const posName = match[1].trim();
      const posNode = findNodeFuzzy(nodes, 'position', posName);
      if (!posNode) return { answer: `未找到职位"${posName}"的数据`, highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      const connected = getConnectedNodes(posNode.id, edges, 'out', '要求');
      const skillIds = connected.map(c => c.nodeId);
      const edgeIdxs = connected.map(c => c.edgeIdx);

      if (skillIds.length === 0) return { answer: `${posName}暂无技能数据`, highlights: { nodeIds: new Set([posNode.id]), edgeIndices: new Set() } };

      const skillNodes = skillIds.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
      const gapSkills = skillNodes.filter(n => n.data.gap);
      const skillList = formatSkillRich(nodes, skillIds);

      let answer = `${posName}要求的技能有：${skillList}`;
      if (gapSkills.length > 0) {
        answer += `\n\n需要补足的技能：${gapSkills.map(n => n.name).join('、')}`;
      }

      return {
        answer,
        highlights: { nodeIds: new Set([posNode.id, ...skillIds]), edgeIndices: new Set(edgeIdxs) },
      };
    },
  },
  // "哪些技能没有覆盖"
  {
    regex: /(哪些|什么)(技能|能力|技术)(没有|未被|未)(覆盖|包含|学习)/,
    handler: (match, nodes, _edges) => {
      const gapNodes = nodes.filter(n => n.type === 'skill' && n.data.gap);
      if (gapNodes.length === 0) return { answer: '所有技能都已被技能树覆盖！🎉', highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      // Group by importance
      const highGaps = gapNodes.filter(n => n.data.importance_mode === 'high');
      const otherGaps = gapNodes.filter(n => n.data.importance_mode !== 'high');

      let answer = `尚未覆盖的技能有${gapNodes.length}个：${gapNodes.map(n => `${n.name}(${n.data.frequency}次)`).join('、')}`;
      if (highGaps.length > 0) {
        answer += `\n\n优先需要补的（重要性高）：${highGaps.map(n => n.name).join('、')}`;
      }
      if (otherGaps.length > 0 && highGaps.length > 0) {
        answer += `\n其他可后续补足：${otherGaps.map(n => n.name).join('、')}`;
      }

      return {
        answer,
        highlights: { nodeIds: new Set(gapNodes.map(n => n.id)), edgeIndices: new Set() },
      };
    },
  },
  // "字节跳动和腾讯的共同技能"
  {
    regex: /(.+?)(和|与|跟|同)(.+?)(共同|相同|一样|交集)(技能|能力|看重|技术)/,
    handler: (match, nodes, edges) => {
      const c1Name = match[1].trim();
      const c2Name = match[3].trim();
      const c1 = findNodeFuzzy(nodes, 'company', c1Name);
      const c2 = findNodeFuzzy(nodes, 'company', c2Name);
      if (!c1 || !c2) return { answer: `未找到公司数据`, highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      const c1Connected = getConnectedNodes(c1.id, edges, 'out', '看重');
      const c2Connected = getConnectedNodes(c2.id, edges, 'out', '看重');
      const c1Skills = new Set(c1Connected.map(c => c.nodeId));
      const c2Skills = new Set(c2Connected.map(c => c.nodeId));

      const common = c2Connected.filter(c => c1Skills.has(c.nodeId));
      const c1Only = c1Connected.filter(c => !c2Skills.has(c.nodeId));
      const c2Only = c2Connected.filter(c => !c1Skills.has(c.nodeId));

      if (common.length === 0) return { answer: `${c1Name}和${c2Name}没有共同看重的技能`, highlights: { nodeIds: new Set([c1.id, c2.id]), edgeIndices: new Set() } };

      let answer = `${c1Name}和${c2Name}共同看重的${common.length}个技能：${formatSkillRich(nodes, common.map(c => c.nodeId))}`;
      if (c1Only.length > 0) {
        answer += `\n\n${c1Name}独有：${formatSkillRich(nodes, c1Only.map(c => c.nodeId))}`;
      }
      if (c2Only.length > 0) {
        answer += `\n${c2Name}独有：${formatSkillRich(nodes, c2Only.map(c => c.nodeId))}`;
      }

      return {
        answer,
        highlights: { nodeIds: new Set([c1.id, c2.id, ...common.map(c => c.nodeId)]), edgeIndices: new Set(common.map(c => c.edgeIdx)) },
      };
    },
  },
  // "字节跳动招什么岗位"
  {
    regex: /(.+?)(招|招聘|招什么)(岗位|职位|什么岗|什么职位)/,
    handler: (match, nodes, edges) => {
      const companyName = match[1].trim();
      const companyNode = findNodeFuzzy(nodes, 'company', companyName);
      if (!companyNode) return { answer: `未找到公司"${companyName}"的数据`, highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      const connected = getConnectedNodes(companyNode.id, edges, 'out', '招聘');
      const posIds = connected.map(c => c.nodeId);
      const edgeIdxs = connected.map(c => c.edgeIdx);

      if (posIds.length === 0) return { answer: `${companyName}暂无岗位数据`, highlights: { nodeIds: new Set([companyNode.id]), edgeIndices: new Set() } };

      const names = posIds.map(id => {
        const n = nodes.find(x => x.id === id);
        return n?.name || '';
      }).filter(Boolean).join('、');

      return {
        answer: `${companyName}招聘的${posIds.length}个职位方向：${names}`,
        highlights: { nodeIds: new Set([companyNode.id, ...posIds]), edgeIndices: new Set(edgeIdxs) },
      };
    },
  },
  // "AI技术包括哪些技能"
  {
    regex: /(.+?)(包括|包含|有哪些|有什么)(技能|能力|技术)/,
    handler: (match, nodes, edges) => {
      const catName = match[1].trim();
      const catNode = findNodeFuzzy(nodes, 'category', catName);
      if (!catNode) return { answer: `未找到"${catName}"的数据`, highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

      // For category/source skill nodes, show what they normalize to
      const connected = getConnectedNodes(catNode.id, edges, 'out', '属于');
      const skillIds = connected.map(c => c.nodeId);
      const edgeIdxs = connected.map(c => c.edgeIdx);

      if (skillIds.length === 0) return { answer: `"${catName}"暂无关联技能`, highlights: { nodeIds: new Set([catNode.id]), edgeIndices: new Set() } };

      const names = skillIds.map(id => {
        const n = nodes.find(x => x.id === id);
        return n?.name || '';
      }).filter(Boolean).join('、');

      return {
        answer: `"${catName}"归一化到以下技能：${names}`,
        highlights: { nodeIds: new Set([catNode.id, ...skillIds]), edgeIndices: new Set(edgeIdxs) },
      };
    },
  },
];

// --- Main query function ---

export function queryKnowledgeGraph(query: string, nodes: KGNode[], edges: KGEdge[]): QAResult {
  const trimmed = query.trim();
  if (!trimmed) return { answer: '', highlights: { nodeIds: new Set(), edgeIndices: new Set() } };

  // Try pattern matching (most specific first)
  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (match) {
      return pattern.handler(match, nodes, edges);
    }
  }

  // Fallback: keyword search across all nodes
  const matched = nodes.filter(n => n.name.includes(trimmed) || (n.data.companies as string[] | undefined)?.some(c => c.includes(trimmed)));
  if (matched.length > 0) {
    const names = matched.map(n => `${n.name}(${n.type === 'company' ? '公司' : n.type === 'skill' ? '技能' : n.type === 'position' ? '职位' : n.type === 'category' ? '来源技能' : '模块'})`).join('、');
    return {
      answer: `找到 ${matched.length} 个相关实体：${names}`,
      highlights: { nodeIds: new Set(matched.map(n => n.id)), edgeIndices: new Set() },
    };
  }

  return { answer: '未找到相关数据，试试：字节跳动看重什么能力', highlights: { nodeIds: new Set(), edgeIndices: new Set() } };
}
