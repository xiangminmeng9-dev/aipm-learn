'use client';

import { COMPANY_TYPE_MAP } from './constants';
import type { CompanyType } from '@/types';

export default function CompanyTypeBadge({ type }: { type: CompanyType | null | undefined }) {
  if (!type || type === 'other') return null;
  const config = COMPANY_TYPE_MAP[type];
  if (!config) return null;

  return (
    <span
      style={{ color: config.color, backgroundColor: config.bg, borderColor: config.color + '30' }}
      className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border leading-none ml-1"
    >
      {config.label}
    </span>
  );
}
