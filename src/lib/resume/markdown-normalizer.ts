/**
 * Normalize AI-generated resume Markdown to ensure proper structure.
 * Extracted from the old generate route for reuse by the agent route.
 */

const SECTION_TITLES = [
  '工作经历', '工作经验', '工作履历',
  '项目经历', '项目经验', '项目履历',
  '实习经历', '实习经验',
  '教育经历', '教育背景', '教育',
  '核心技能', '专业技能', '技能', '技术栈',
  '自我评价', '个人总结',
  '获奖经历', '荣誉奖项',
  '证书', '资格认证',
  '语言能力',
];

const BLOCK_STARTS = ['项目背景', '职责', '成果', '产品侧核心贡献', '核心贡献'];

export function normalizeResumeMarkdown(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { result.push(''); continue; }

    if (/^#{1,4}\s/.test(trimmed)) {
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
      result.push(trimmed);
      result.push('');
      continue;
    }

    if (/^>\s/.test(trimmed)) {
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
      result.push(trimmed);
      continue;
    }

    if (/^[-*+]\s/.test(trimmed)) { result.push(trimmed); continue; }

    let matchedSection = false;
    const strippedBold = trimmed.replace(/^\*\*(.+?)\*\*$/, '$1');
    for (const title of SECTION_TITLES) {
      if (strippedBold === title || strippedBold === title + '：' || strippedBold === title + ':') {
        result.push('');
        result.push('## ' + title);
        result.push('');
        matchedSection = true;
        break;
      }
    }
    if (matchedSection) continue;

    const hasDateSuffix = /\d{4}[./]\d{1,2}\s*[-–—至]\s*(\d{4}[./]\d{1,2}|至今)/.test(trimmed)
      || /\*\d{4}[./]\d{1,2}\s*[-–—至]\s*(\d{4}[./]\d{1,2}|至今)\*/.test(trimmed);
    if (hasDateSuffix && trimmed.length <= 80 && !trimmed.startsWith('-')) {
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
      result.push('### ' + trimmed);
      result.push('');
      continue;
    }

    const nextTrimmed = (lines[i + 1] || '').trim();
    const isBlockKeywordLine = BLOCK_STARTS.some(kw => trimmed.startsWith(kw + '：') || trimmed.startsWith(kw + ':'));
    if (!isBlockKeywordLine && trimmed.length <= 30 && !trimmed.startsWith('-')) {
      const isProjectName = nextTrimmed.startsWith('项目背景：') || nextTrimmed.startsWith('项目背景:') || nextTrimmed.startsWith('职责：') || nextTrimmed.startsWith('职责:');
      if (isProjectName) {
        if (result.length > 0 && result[result.length - 1] !== '') result.push('');
        result.push('### ' + trimmed);
        result.push('');
        continue;
      }
    }

    if (BLOCK_STARTS.some(kw => trimmed.startsWith(kw + '：') || trimmed.startsWith(kw + ':'))) {
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
    }

    result.push(trimmed);
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
