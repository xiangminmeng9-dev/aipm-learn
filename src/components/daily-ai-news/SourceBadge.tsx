'use client';

import { SOURCE_COLORS, SOURCE_DEFAULT } from './constants';

interface Props {
  source: string;
}

export default function SourceBadge({ source }: Props) {
  const cls = SOURCE_COLORS[source] ?? SOURCE_DEFAULT;
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-sm font-medium ${cls}`}>
      {source}
    </span>
  );
}