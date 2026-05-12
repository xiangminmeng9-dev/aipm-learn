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
    symbolSize: 8,
    lineStyle: {
      width: 2,
    },
  },
  // 清晰的文字
  textStyle: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    fontWeight: 500,
  },
};

// 获取设备像素比
export function getDevicePixelRatio() {
  if (typeof window !== 'undefined') {
    return window.devicePixelRatio || 2;
  }
  return 2;
}

export default ReactECharts;
