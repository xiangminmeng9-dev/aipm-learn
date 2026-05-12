'use client';

interface PageShellProps {
  title: string;
  description?: string;
  icon?: string;
  stats?: { label: string; value: string | number; trend?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function PageShell({
  title, description, icon, stats, actions, children, className = '',
}: PageShellProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
              {icon && <span className="text-2xl">{icon}</span>}
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {stats && stats.length > 0 && (
        <div className="grid auto-cols-fr grid-flow-col gap-4 border-b border-border bg-card px-6 py-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-background p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
              {s.trend && (
                <div className={`mt-1 text-[11px] font-medium ${s.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {s.trend}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
