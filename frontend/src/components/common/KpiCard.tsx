import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: {
    text: string;
    type: 'good' | 'warn' | 'crit' | 'neutral';
  };
  icon?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtext, badge, icon }) => {
  let badgeColor = 'text-slate-400 bg-slate-800/80 border-slate-700';
  if (badge?.type === 'good') badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (badge?.type === 'warn') badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  if (badge?.type === 'crit') badgeColor = 'text-red-400 bg-red-500/10 border-red-500/30';

  return (
    <div className="bg-industrial-card border border-industrial-border rounded-md p-3.5 flex flex-col justify-between hover:border-industrial-border-light transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-industrial-text">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${badgeColor}`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <span className="text-[11px] text-slate-500 mt-1 font-mono leading-tight">
          {subtext}
        </span>
      )}
    </div>
  );
};

