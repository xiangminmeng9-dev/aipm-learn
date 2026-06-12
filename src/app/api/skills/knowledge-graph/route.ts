import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeSkill } from '@/lib/ai/skill-normalizer';

function getPositionCategory(positionName: string): string {
  const pos = (positionName || '').toLowerCase();
  if (pos.includes('产品') || pos.includes('pm') || pos.includes('product')) return '产品经理';
  if (pos.includes('运营') || pos.includes('operation')) return '运营';
  if (pos.includes('销售') || pos.includes('商务') || pos.includes('bd')) return '销售';
  if (pos.includes('开发') || pos.includes('工程师') || pos.includes('技术')) return '技术';
  if (pos.includes('设计') || pos.includes('ui') || pos.includes('ux')) return '设计';
  if (pos.includes('数据') || pos.includes('分析') || pos.includes('算法')) return '数据';
  if (pos.includes('市场') || pos.includes('营销')) return '市场';
  if (pos.includes('人力') || pos.includes('hr')) return '人力';
  if (pos.includes('财务') || pos.includes('会计')) return '财务';
  return '其他';
}

// --- Types ---

export interface KGNode {
  id: string;
  name: string;
  type: 'company' | 'skill' | 'position' | 'category' | 'module';
  symbolSize: number;
  itemStyle: {
    color: string;
    borderColor?: string;
    borderWidth?: number;
    borderType?: 'solid' | 'dashed';
    opacity?: number;
  };
  data: Record<string, unknown>;
}

export interface KGEdge {
  source: string;
  target: string;
  relation: '看重' | '招聘' | '要求' | '属于' | '已覆盖';
  lineStyle: {
    width: number;
    color: string;
    type?: 'solid' | 'dashed';
    opacity?: number;
    curveness?: number;
  };
  data: Record<string, unknown>;
}

// --- Colors ---

const COLORS = {
  company: '#6366F1',
  skill: '#06B6D4',
  skillGap: '#06B6D4',
  position: '#F59E0B',
  category: '#10B981',
  module: '#8B5CF6',
  edge: {
    看重: '#A5B4FC',
    招聘: '#FCD34D',
    要求: '#67E8F9',
    属于: '#6EE7B7',
    已覆盖: '#C4B5FD',
  },
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '请先登录' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '30d';
    const minFrequency = parseInt(searchParams.get('minFrequency') || '1');
    const maxCompanies = parseInt(searchParams.get('maxCompanies') || '0');
    const maxSkills = parseInt(searchParams.get('maxSkills') || '200');

    const now = new Date();
    const cutoffDate = range === '7d' ? new Date(now.getTime() - 7 * 86400000).toISOString()
                    : range === '30d' ? new Date(now.getTime() - 30 * 86400000).toISOString()
                    : new Date(0).toISOString();

    // Parallel data fetch
    const [jdAnalysesRes, skillModulesRes, jdSkillsRes] = await Promise.all([
      supabase.from('jd_analyses')
        .select('id, company_name, position_name, extracted_skills, skill_module_matches, created_at')
        .eq('user_id', user.id)
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false }),
      supabase.from('skill_modules').select('id, name, level'),
      supabase.from('jd_skills').select('skill_name, category, frequency').eq('user_id', user.id),
    ]);

    const jdAnalyses = jdAnalysesRes.data || [];
    const skillModules = skillModulesRes.data || [];
    const jdSkills = jdSkillsRes.data || [];

    // Build module name set for coverage check
    const moduleNames = new Set(skillModules.map(m => m.name));

    // --- Aggregate skill data per company and position ---
    // Map: normalizedSkill -> { count, companies: Set, categories: Set, importance: {high,medium,low}, covered: bool, moduleMatches: [] }
    const skillMap = new Map<string, {
      rawName: string;
      count: number;
      companies: Set<string>;
      categories: Set<string>;
      importance: { high: number; medium: number; low: number };
      covered: boolean;
      bestMatchScore: number;
      matchedModuleId: string | null;
      matchedModuleName: string | null;
    }>();

    // Map: company -> { jdCount, positions: Set, skills: Map<normalizedSkill, { count, importance }> }
    const companyMap = new Map<string, {
      jdCount: number;
      positions: Set<string>;
      skills: Map<string, { count: number; importance: string }>;
    }>();

    // Map: position -> { jdCount, skills: Map<normalizedSkill, number> }
    const positionMap = new Map<string, {
      jdCount: number;
      skills: Map<string, number>;
    }>();

    // Process each JD analysis
    for (const jd of jdAnalyses) {
      const company = jd.company_name?.trim() || '未提及公司';
      const position = getPositionCategory(jd.position_name || '');
      const extractedSkills = (jd.extracted_skills || []) as Array<{ skill_name: string; category: string; importance: string }>;
      const moduleMatches = (jd.skill_module_matches || []) as Array<{ skill_name: string; module_id: string; module_name: string; match_score: number }>;

      // Update company map
      if (!companyMap.has(company)) {
        companyMap.set(company, { jdCount: 0, positions: new Set(), skills: new Map() });
      }
      const companyData = companyMap.get(company)!;
      companyData.jdCount++;
      if (position) companyData.positions.add(position);

      // Update position map
      if (position) {
        if (!positionMap.has(position)) {
          positionMap.set(position, { jdCount: 0, skills: new Map() });
        }
        positionMap.get(position)!.jdCount++;
      }

      // Process skills
      for (const s of extractedSkills) {
        const normalized = normalizeSkill(s.skill_name);
        if (!normalized) continue;

        // Update skill map
        if (!skillMap.has(normalized)) {
          skillMap.set(normalized, {
            rawName: normalized,
            count: 0,
            companies: new Set(),
            categories: new Set(),
            importance: { high: 0, medium: 0, low: 0 },
            covered: false,
            bestMatchScore: 0,
            matchedModuleId: null,
            matchedModuleName: null,
          });
        }
        const skillData = skillMap.get(normalized)!;
        skillData.count++;
        skillData.companies.add(company);
        if (s.category) skillData.categories.add(s.category);
        const imp = (s.importance || 'medium').toLowerCase();
        if (imp === 'high') skillData.importance.high++;
        else if (imp === 'low') skillData.importance.low++;
        else skillData.importance.medium++;

        // Company-skill edge data
        const existing = companyData.skills.get(normalized) || { count: 0, importance: 'medium' };
        companyData.skills.set(normalized, { count: existing.count + 1, importance: imp === 'high' ? 'high' : existing.importance });

        // Position-skill
        if (position) {
          const posSkills = positionMap.get(position)!.skills;
          posSkills.set(normalized, (posSkills.get(normalized) || 0) + 1);
        }
      }

      // Process module matches for coverage
      for (const m of moduleMatches) {
        const normalized = normalizeSkill(m.skill_name);
        if (!normalized || !skillMap.has(normalized)) continue;
        const skillData = skillMap.get(normalized)!;
        if (m.match_score > 0) {
          skillData.covered = true;
          if (m.match_score > skillData.bestMatchScore) {
            skillData.bestMatchScore = m.match_score;
            skillData.matchedModuleId = m.module_id;
            skillData.matchedModuleName = m.module_name;
          }
        }
      }
    }

    // Also apply jd_skills frequency data
    for (const js of jdSkills) {
      const normalized = normalizeSkill(js.skill_name);
      if (!normalized || !skillMap.has(normalized)) continue;
      // Use the higher count between our aggregation and the stored frequency
      const skillData = skillMap.get(normalized)!;
      if (js.frequency > skillData.count) {
        skillData.count = js.frequency;
      }
      if (js.category) skillData.categories.add(js.category);
    }

    // Check coverage against module names
    for (const [name, skillData] of skillMap) {
      if (!skillData.covered) {
        // Fuzzy check: if the normalized skill name is contained in any module name
        for (const modName of moduleNames) {
          if (modName.includes(name) || name.includes(modName)) {
            skillData.covered = true;
            break;
          }
        }
      }
    }

    // --- Filter and trim ---
    // Filter skills by min frequency
    const filteredSkills = [...skillMap.entries()]
      .filter(([_, s]) => s.count >= minFrequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, maxSkills || undefined);

    const includedSkills = new Set(filteredSkills.map(([n]) => n));

    // Filter companies, exclude "未提及公司"
    const filteredCompanies = [...companyMap.entries()]
      .filter(([c]) => c !== '未提及公司')
      .sort((a, b) => b[1].jdCount - a[1].jdCount)
      .slice(0, maxCompanies || undefined);

    const includedCompanies = new Set(filteredCompanies.map(([c]) => c));

    // Collect positions and categories that have included skills
    const includedPositions = new Set<string>();
    const includedCategories = new Set<string>();
    for (const [_, skillData] of filteredSkills) {
      for (const cat of skillData.categories) includedCategories.add(cat);
    }
    for (const [_, companyData] of filteredCompanies) {
      for (const pos of companyData.positions) includedPositions.add(pos);
    }

    // --- Build nodes ---
    const nodes: KGNode[] = [];
    const nodeIds = new Set<string>();

    // Company nodes
    for (const [company, data] of filteredCompanies) {
      const id = `c:${company}`;
      nodeIds.add(id);
      nodes.push({
        id,
        name: company,
        type: 'company',
        symbolSize: 20 + Math.min(data.jdCount * 3, 30),
        itemStyle: { color: COLORS.company, borderWidth: 2, borderColor: '#4F46E5' },
        data: { jd_count: data.jdCount, positions: [...data.positions] },
      });
    }

    // Skill nodes
    for (const [skillName, data] of filteredSkills) {
      const id = `s:${skillName}`;
      nodeIds.add(id);
      const isCovered = data.covered;
      const impMode = data.importance.high >= data.importance.medium && data.importance.high > 0 ? 'high'
        : data.importance.medium >= data.importance.low ? 'medium' : 'low';
      nodes.push({
        id,
        name: skillName,
        type: 'skill',
        symbolSize: 15 + Math.min(data.count * 2, 25),
        itemStyle: {
          color: isCovered ? COLORS.skill : COLORS.skillGap,
          borderColor: isCovered ? '#0891B2' : '#EF4444',
          borderWidth: isCovered ? 2 : 2,
          borderType: isCovered ? 'solid' : 'dashed',
          opacity: isCovered ? 1 : 0.6,
        },
        data: {
          frequency: data.count,
          covered: isCovered,
          gap: !isCovered,
          importance_mode: impMode,
          companies: [...data.companies].filter(c => includedCompanies.has(c)),
          categories: [...data.categories],
          matched_module: data.matchedModuleName,
        },
      });
    }

    // Position nodes
    for (const pos of includedPositions) {
      const id = `p:${pos}`;
      if (nodeIds.has(id)) continue;
      nodeIds.add(id);
      const posData = positionMap.get(pos);
      nodes.push({
        id,
        name: pos,
        type: 'position',
        symbolSize: 18 + Math.min((posData?.jdCount || 1) * 2, 20),
        itemStyle: { color: COLORS.position, borderWidth: 2, borderColor: '#D97706' },
        data: { position_jd_count: posData?.jdCount || 0 },
      });
    }

    // Category nodes
    for (const cat of includedCategories) {
      const id = `cat:${cat}`;
      if (nodeIds.has(id)) continue;
      nodeIds.add(id);
      const catSkillCount = filteredSkills.filter(([_, s]) => s.categories.has(cat)).length;
      nodes.push({
        id,
        name: cat,
        type: 'category',
        symbolSize: 16 + Math.min(catSkillCount * 2, 20),
        itemStyle: { color: COLORS.category, borderWidth: 2, borderColor: '#059669' },
        data: { skill_count: catSkillCount },
      });
    }

    // Module nodes (only for covered skills)
    const addedModules = new Set<string>();
    for (const [_, data] of filteredSkills) {
      if (data.covered && data.matchedModuleId && !addedModules.has(data.matchedModuleId)) {
        addedModules.add(data.matchedModuleId);
        const id = `m:${data.matchedModuleId}`;
        if (nodeIds.has(id)) continue;
        nodeIds.add(id);
        const mod = skillModules.find(m => m.id === data.matchedModuleId);
        nodes.push({
          id,
          name: data.matchedModuleName || mod?.name || '未知模块',
          type: 'module',
          symbolSize: 18,
          itemStyle: { color: COLORS.module, borderWidth: 2, borderColor: '#7C3AED' },
          data: { module_level: mod?.level, module_id: data.matchedModuleId },
        });
      }
    }

    // --- Build edges ---
    const edges: KGEdge[] = [];

    // Company -> Skill edges ("看重")
    for (const [company, companyData] of filteredCompanies) {
      for (const [skillName, skillEdge] of companyData.skills) {
        if (!includedSkills.has(skillName)) continue;
        const sourceId = `c:${company}`;
        const targetId = `s:${skillName}`;
        if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) continue;
        const imp = skillEdge.importance;
        edges.push({
          source: sourceId,
          target: targetId,
          relation: '看重',
          lineStyle: {
            width: imp === 'high' ? 3 : imp === 'medium' ? 2 : 1,
            color: COLORS.edge.看重,
            type: imp === 'low' ? 'dashed' : 'solid',
            opacity: imp === 'high' ? 0.8 : 0.4,
            curveness: 0.2,
          },
          data: { importance: imp, frequency: skillEdge.count },
        });
      }
    }

    // Company -> Position edges ("招聘")
    for (const [company, companyData] of filteredCompanies) {
      for (const pos of companyData.positions) {
        if (!includedPositions.has(pos)) continue;
        const sourceId = `c:${company}`;
        const targetId = `p:${pos}`;
        if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) continue;
        edges.push({
          source: sourceId,
          target: targetId,
          relation: '招聘',
          lineStyle: { width: 2, color: COLORS.edge.招聘, opacity: 0.5, curveness: 0.2 },
          data: { count: companyData.jdCount },
        });
      }
    }

    // Position -> Skill edges ("要求")
    for (const [pos, posData] of positionMap) {
      if (!includedPositions.has(pos)) continue;
      const sourceId = `p:${pos}`;
      if (!nodeIds.has(sourceId)) continue;
      // Only top skills per position
      const topSkills = [...posData.skills.entries()]
        .filter(([n]) => includedSkills.has(n))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      for (const [skillName, count] of topSkills) {
        const targetId = `s:${skillName}`;
        if (!nodeIds.has(targetId)) continue;
        const skillData = skillMap.get(skillName);
        const imp = skillData && skillData.importance.high > skillData.importance.medium ? 'high' : 'medium';
        edges.push({
          source: sourceId,
          target: targetId,
          relation: '要求',
          lineStyle: { width: imp === 'high' ? 2.5 : 1.5, color: COLORS.edge.要求, opacity: 0.4, curveness: 0.1 },
          data: { importance: imp, frequency: count },
        });
      }
    }

    // Skill -> Category edges ("属于")
    for (const [skillName, skillData] of filteredSkills) {
      const sourceId = `s:${skillName}`;
      if (!nodeIds.has(sourceId)) continue;
      for (const cat of skillData.categories) {
        if (!includedCategories.has(cat)) continue;
        const targetId = `cat:${cat}`;
        if (!nodeIds.has(targetId)) continue;
        edges.push({
          source: sourceId,
          target: targetId,
          relation: '属于',
          lineStyle: { width: 1, color: COLORS.edge.属于, type: 'dashed', opacity: 0.3 },
          data: {},
        });
      }
    }

    // Skill -> Module edges ("已覆盖")
    for (const [skillName, skillData] of filteredSkills) {
      if (!skillData.covered || !skillData.matchedModuleId) continue;
      const sourceId = `s:${skillName}`;
      const targetId = `m:${skillData.matchedModuleId}`;
      if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) continue;
      edges.push({
        source: sourceId,
        target: targetId,
        relation: '已覆盖',
        lineStyle: { width: skillData.bestMatchScore > 70 ? 2 : 1, color: COLORS.edge.已覆盖, opacity: 0.5 },
        data: { match_score: skillData.bestMatchScore },
      });
    }

    // --- Meta ---
    const coveredCount = filteredSkills.filter(([_, s]) => s.covered).length;
    const meta = {
      total_companies: filteredCompanies.length,
      total_skills: filteredSkills.length,
      total_positions: includedPositions.size,
      total_categories: includedCategories.size,
      total_modules: addedModules.size,
      covered_count: coveredCount,
      gap_count: filteredSkills.length - coveredCount,
    };

    return NextResponse.json({ nodes, edges, meta });
  } catch (error) {
    console.error('Knowledge graph API error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
