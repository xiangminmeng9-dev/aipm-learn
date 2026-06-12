'use client';

import dynamic from 'next/dynamic';

// Lazy-load the tree-shaken ChartRenderer — keeps echarts out of the initial page bundle
const ChartRenderer = dynamic(() => import('./ChartRenderer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
    </div>
  ),
});

// Re-export the highDPIChartOption and getDevicePixelRatio from the old wrapper for backward compat
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

interface LazyEChartsProps {
  // Use Record<string, unknown> for maximum compatibility — echarts strict types
  // are too narrow for real-world option objects with custom properties
  option: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
  opts?: { renderer?: 'canvas' | 'svg'; devicePixelRatio?: number };
  onEvents?: Record<string, (params?: unknown) => void>;
}

export default function LazyECharts({ option, style, className, opts, onEvents }: LazyEChartsProps) {
  return <ChartRenderer option={option} style={style} className={className} opts={opts} onEvents={onEvents} />;
}
