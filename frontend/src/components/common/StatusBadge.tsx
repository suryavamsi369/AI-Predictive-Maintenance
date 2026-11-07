import React from 'react';

interface StatusBadgeProps {
  status?: string | null;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-800/60 border-slate-700 text-slate-300';
  let dotColor = 'bg-slate-400';
  let label = status || 'UNKNOWN';

  if (
    normalized.includes('critical') ||
    normalized.includes('danger') ||
    normalized.includes('maintenance required') ||
    normalized === 'high'
  ) {
    colorClasses = 'bg-telemetry-crit-bg border-telemetry-crit-border text-red-400';
    dotColor = 'bg-red-500';
    label = normalized.includes('maintenance') ? 'MAINTENANCE REQ.' : 'CRITICAL';
  } else if (
    normalized.includes('warning') ||
    normalized.includes('moderate') ||
    normalized.includes('warn')
  ) {
    colorClasses = 'bg-telemetry-warn-bg border-telemetry-warn-border text-amber-400';
    dotColor = 'bg-amber-500';
    label = 'WARNING';
  } else if (
    normalized.includes('healthy') ||
    normalized.includes('normal') ||
    normalized.includes('active') ||
    normalized.includes('good')
  ) {
    colorClasses = 'bg-telemetry-good-bg border-telemetry-good-border text-emerald-400';
    dotColor = 'bg-emerald-500';
    label = normalized.includes('normal') ? 'NORMAL' : 'HEALTHY';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-mono tracking-wider'
      : 'px-2.5 py-1 text-xs font-mono tracking-wider';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border uppercase font-medium select-none ${sizeClasses} ${colorClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};

