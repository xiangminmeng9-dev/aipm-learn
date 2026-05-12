import { APPLICATION_CHANNELS } from './constants';

export function ApplicationChannelBadge({ channel }: { channel: string }) {
  const config = APPLICATION_CHANNELS.find((c) => c.value === channel);
  if (!config) return <span className="rounded px-2 py-0.5 text-xs bg-muted text-muted-foreground">{channel}</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs bg-muted text-muted-foreground">
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
