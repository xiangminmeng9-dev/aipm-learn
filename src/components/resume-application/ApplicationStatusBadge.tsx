import { APPLICATION_STATUSES } from './constants';

export function ApplicationStatusBadge({ status }: { status: string }) {
  const config = APPLICATION_STATUSES.find((s) => s.value === status);
  if (!config) return <span className="rounded px-2 py-0.5 text-xs bg-slate-100 text-slate-600">{status}</span>;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>{config.label}</span>;
}
