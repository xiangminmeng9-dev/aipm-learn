/** 深空星系配色方案 */
export const LEVEL_COLORS: Record<number, string> = {
  1: '#00D4FF', // 星蓝 - 基础入门
  2: '#A855F7', // 星紫 - 核心能力
  3: '#F472B6', // 星粉 - 进阶专项
  4: '#FBBF24', // 星金 - 实战综合
};

export const CUSTOM_COLOR = '#34D399'; // 星绿 - 自定义模块

export const LINK_COLOR = 'rgba(255,255,255,0.08)';
export const LINK_HIGHLIGHT_COLOR = 'rgba(255,255,255,0.3)';

export function getLevelColor(level: number, isCustom?: boolean): string {
  if (isCustom) return CUSTOM_COLOR;
  return LEVEL_COLORS[level] || '#FFFFFF';
}

/** 节点大小：按进度从小到大，2~8 */
export function getNodeSize(progress: number): number {
  return 2 + (progress / 100) * 6;
}

/** 光晕颜色（半透明版本） */
export function getGlowColor(level: number, isCustom?: boolean): string {
  const base = getLevelColor(level, isCustom);
  // Add alpha for glow
  if (base.length === 7) return base + '66';
  return base;
}
