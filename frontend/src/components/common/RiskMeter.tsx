import React from 'react';

interface RiskMeterProps {
  probability: number | null | undefined; // 0.0 to 1.0 or 0 to 100
  showLabel?: boolean;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ probability, showLabel = true }) => {
  if (probability === null || probability === undefined) {
    return <span className="text-xs text-slate-500 font-mono">N/A</span>;
  }

  // Normalize probability to 0 - 100 percentage
  const pct = probability <= 1.0 ? Math.round(probability * 1000) / 10 : Math.round(probability * 10) / 10;
  const clamped = Math.min(Math.max(pct, 0), 100);

  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';
  let riskLevel = 'LOW';

  if (clamped >= 65) {
    barColor = 'bg-red-500';
    textColor = 'text-red-400';
    riskLevel = 'HIGH';
  } else if (clamped >= 30) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
    riskLevel = 'MODERATE';
  }

  return (
    <div className="flex flex-col gap-1 w-full min-w-[120px]">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className={`font-semibold ${textColor}`}>{clamped.toFixed(1)}%</span>
        {showLabel && (
          <span className="text-[10px] text-slate-400 tracking-wider uppercase">
            {riskLevel} RISK
          </span>
        )}
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

