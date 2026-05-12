'use client';

import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  ),
});

// 高清图表默认配置
export const highDPIChartOption = {
  animation: true,
  animationDuration: 300,
  animationEasing: 'cubicOut',
  // 清晰的线条
  line: {
    smooth: false,
    symbol: 'circle',
    symbolSize: 10,
    lineStyle: {
      width: 3,
    },
  },
  // 清晰的文字
  textStyle: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    fontWeight: 600,
  },
  // 柱状图清晰
  bar: {
    barBorderWidth: 1,
  },
  // 饼图清晰
  pie: {
    label: {
      fontWeight: 600,
    },
  },
};

// 获取设备像素比 - 强制使用更高比例
export function getDevicePixelRatio() {
  if (typeof window !== 'undefined') {
    const dpr = window.devicePixelRatio || 2;
    // 强制至少2倍像素密度，确保2K清晰度
    return Math.max(dpr, 2.5);
  }
  return 3;
}

export default ReactECharts;
