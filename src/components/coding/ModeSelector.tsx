'use client';

import type { DevMode } from '@/types';

interface ModeSelectorProps {
  modes: DevMode[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function ModeSelector({ modes, selected, onSelect }: ModeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#6B7280]">选择开发模式</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className={`cursor-pointer rounded-2xl p-4 transition-all ${
              selected === mode.id
                ? 'bg-indigo-50 ring-2 ring-indigo-500'
                : 'bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6]'
            }`}
            onClick={() => onSelect(mode.id)}
          >
            <p className={`text-sm font-semibold ${selected === mode.id ? 'text-indigo-600' : 'text-[#1F2937]'}`}>{mode.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[#6B7280]">{mode.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
