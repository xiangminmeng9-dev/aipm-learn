export default function Loading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-7 w-48 rounded-lg bg-muted/60" />
      <div className="h-4 w-72 rounded bg-muted/40" />
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="h-5 w-3/4 rounded bg-muted/50" />
        <div className="h-4 w-full rounded bg-muted/30" />
        <div className="h-4 w-2/3 rounded bg-muted/30" />
      </div>
    </div>
  );
}
