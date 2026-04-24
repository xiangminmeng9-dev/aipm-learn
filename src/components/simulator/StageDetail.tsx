'use client';

import type { SimulatorStageConfig } from '@/lib/simulator-config';

interface StageDetailProps {
  stage: SimulatorStageConfig;
}

export default function StageDetail({ stage }: StageDetailProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl">{stage.npcAvatar}</span>
          <div>
            <h3 className="text-sm font-semibold text-teal-800">{stage.npcName}</h3>
            <p className="text-xs text-teal-600">{stage.npcRole}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-gray-700">{stage.description}</p>
      </div>

      {stage.resources.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">前置阅读</h4>
          <div className="space-y-2">
            {stage.resources.map((r, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs">
                  {r.type === 'article' ? '📄' : r.type === 'book' ? '📚' : r.type === 'video' ? '🎬' : '📝'}
                </span>
                <span className="text-sm text-gray-700">{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">通关标准</h4>
        <p className="text-sm text-amber-800">{stage.passCriteria}</p>
      </div>
    </div>
  );
}
