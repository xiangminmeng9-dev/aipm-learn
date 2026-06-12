'use client';

import * as echarts from 'echarts/core';
import { LineChart, PieChart, BarChart, RadarChart, TreemapChart, FunnelChart, GaugeChart, GraphChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  VisualMapComponent,
  GraphicComponent,
} from 'echarts/components';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import { useEffect, useRef, useState, useCallback } from 'react';

// Register only the modules we actually use — tree-shakes out ~70% of the full echarts bundle
echarts.use([
  LineChart, PieChart, BarChart, RadarChart, TreemapChart, FunnelChart, GaugeChart, GraphChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, VisualMapComponent, GraphicComponent,
  CanvasRenderer, SVGRenderer,
]);

interface ChartRendererProps {
  option: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
  opts?: { renderer?: 'canvas' | 'svg'; devicePixelRatio?: number };
  onEvents?: Record<string, (params?: unknown) => void>;
}

export default function ChartRenderer({ option, style, className, opts, onEvents }: ChartRendererProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;
    const renderer = opts?.renderer === 'svg' ? 'svg' : 'canvas';
    const instance = echarts.init(chartRef.current, undefined, {
      renderer,
      devicePixelRatio: opts?.devicePixelRatio ?? Math.max(window.devicePixelRatio || 1, 2),
    });
    setChart(instance);

    const onResize = () => instance.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      instance.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update option
  useEffect(() => {
    if (chart) {
      chart.setOption(option as echarts.EChartsCoreOption, { notMerge: true });
    }
  }, [chart, option]);

  // Bind events
  useEffect(() => {
    if (!chart || !onEvents) return;

    // Unbind previous events
    chart.off();

    // Bind new events
    for (const [eventName, handler] of Object.entries(onEvents)) {
      chart.on(eventName, (params: unknown) => handler(params));
    }

    return () => {
      chart.off();
    };
  }, [chart, onEvents]);

  return <div ref={chartRef} style={style} className={className} />;
}