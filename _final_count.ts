import { normalizeSkill } from './src/lib/ai/skill-normalizer';
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('/tmp/jd_full.json','utf8'));

// normalizeSkill 已经内置了 onceSkillRemap，不需要再单独调用
const skillMap = new Map<string, { count: number; companies: Map<string, number> }>();

for (const r of data) {
  const company = r.company_name || '未知公司';
  const skills = r.extracted_skills || [];
  const seenInJd = new Set();

  for (const s of skills) {
    const rawName = typeof s === 'object' ? s.skill_name : s;
    if (!rawName) continue;
    const final = normalizeSkill(rawName);
    if (seenInJd.has(final)) continue;
    seenInJd.add(final);

    if (!skillMap.has(final)) skillMap.set(final, { count: 0, companies: new Map() });
    const entry = skillMap.get(final)!;
    entry.count++;
    entry.companies.set(company, (entry.companies.get(company) || 0) + 1);
  }
}

const sorted = [...skillMap.entries()].sort((a,b) => b[1].count - a[1].count);

console.log('=== 全量归一化映射后最终统计 ===');
console.log(`技能总数: ${skillMap.size}`);
console.log();

for (const [name, info] of sorted) {
  const topCompanies = [...info.companies.entries()].sort((a,b) => b[1]-a[1]).slice(0,5).map(([c,n]) => c+'('+n+')').join(', ');
  console.log(name + ' | ' + info.count + '次 | ' + topCompanies);
}
