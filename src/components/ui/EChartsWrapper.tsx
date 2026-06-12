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

export const highDPIChartOption = {
  animation: true,
  animationDuration: 300,
  animationEasing: 'cubicOut',
  line: {
    smooth: false,
    symbol: 'circle',
    symbolSize: 10,
    lineStyle: {
      width: 3,
    },
  },
  textStyle: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif',
    fontWeight: 600,
  },
  bar: {
    barBorderWidth: 1,
  },
  pie: {
    label: {
      fontWeight: 600,
    },
  },
};

export function getDevicePixelRatio() {
  if (typeof window !== 'undefined') {
    const dpr = window.devicePixelRatio || 2;
    return Math.max(dpr, 2.5);
  }
  return 3;
}

export default ReactECharts;