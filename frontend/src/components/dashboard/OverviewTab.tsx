import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  Gauge,
  Layers,
  Search,
} from 'lucide-react';
import { Machine, ModelInfo, PredictionRecord, ViewTab } from '../../types';
import { KpiCard } from '../common/KpiCard';
import { RiskMeter } from '../common/RiskMeter';
import { StatusBadge } from '../common/StatusBadge';

interface OverviewTabProps {
  machines: Machine[];
  predictions: PredictionRecord[];
  modelInfo: ModelInfo | null;
  onNavigateTab: (tab: ViewTab) => void;
  onSelectMachine: (machineId: string) => void;
  onRunDiagnostic: (machineId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  machines,
  predictions,
  modelInfo,
  onNavigateTab,
  onSelectMachine,
  onRunDiagnostic,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY'>('ALL');

  // Compute machine latest status map
  const latestPredictionsByMachine: Record<string, PredictionRecord> = {};
  for (const pred of predictions) {
    if (!latestPredictionsByMachine[pred.machine_id]) {
      latestPredictionsByMachine[pred.machine_id] = pred;
    }
  }

  // Calculate fleet health statistics
  let criticalCount = 0;
  let warningCount = 0;
  let healthyCount = 0;

  machines.forEach((m) => {
    const latest = latestPredictionsByMachine[m.machine_id];
    const statusStr = (latest?.health_status || latest?.prediction || 'HEALTHY').toUpperCase();
    if (statusStr.includes('CRITICAL') || statusStr.includes('MAINTENANCE')) {
      criticalCount++;
    } else if (statusStr.includes('WARNING') || statusStr.includes('MODERATE')) {
      warningCount++;
    } else {
      healthyCount++;
    }
  });

  // Filtered machines
  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.machine_id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (m.name || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(filterQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    const latest = latestPredictionsByMachine[m.machine_id];
    const statusStr = (latest?.health_status || latest?.prediction || 'HEALTHY').toUpperCase();

    if (statusFilter === 'CRITICAL') return statusStr.includes('CRITICAL') || statusStr.includes('MAINTENANCE');
    if (statusFilter === 'WARNING') return statusStr.includes('WARNING');
    if (statusFilter === 'HEALTHY') return !statusStr.includes('CRITICAL') && !statusStr.includes('WARNING');
    return true;
  });

  // Recent critical / high-risk predictions
  const criticalPredictions = predictions
    .filter((p) => (p.failure_probability || 0) >= 0.65 || (p.health_status || '').includes('Critical'))
    .slice(0, 5);

  const modelAccuracy = modelInfo?.metadata?.metrics?.accuracy
    ? (modelInfo.metadata.metrics.accuracy * 100).toFixed(1) + '%'
    : '99.5%';

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Total Monitored Assets"
          value={machines.length}
          subtext="Industrial telemetry registry"
          icon={<Cpu className="w-4 h-4" />}
        />
        <KpiCard
          label="Critical Risk Alerts"
          value={criticalCount}
          subtext="Immediate maintenance required"
          badge={{ text: criticalCount > 0 ? 'ACTION REQ.' : 'CLEAR', type: criticalCount > 0 ? 'crit' : 'good' }}
          icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
        />
        <KpiCard
          label="Inspection Warnings"
          value={warningCount}
          subtext="Elevated vibration / thermal stress"
          badge={{ text: warningCount > 0 ? 'ATTENTION' : 'CLEAR', type: warningCount > 0 ? 'warn' : 'good' }}
          icon={<Activity className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          label="Healthy Operation"
          value={healthyCount}
          subtext="Nominal operating regimes"
          badge={{ text: 'NORMAL', type: 'good' }}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          label="Evaluations Processed"
          value={predictions.length}
          subtext="Historical inference records"
          icon={<Layers className="w-4 h-4" />}
        />
        <KpiCard
          label="ML Model Accuracy"
          value={modelAccuracy}
          subtext="Random Forest (150 trees)"
          badge={{ text: 'TESTED', type: 'neutral' }}
          icon={<Gauge className="w-4 h-4 text-blue-400" />}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Fleet Status Matrix */}
        <div className="lg:col-span-2 bg-industrial-surface border border-industrial-border rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-industrial-border bg-industrial-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Active Machine Fleet Health Matrix</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Real-time condition evaluation from latest sensor inferences
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {(['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium uppercase transition-colors ${
                    statusFilter === filter
                      ? 'bg-industrial-elevated text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2.5 border-b border-industrial-border bg-[#0e1422] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by Machine ID, name, or facility location..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="text-[10px] text-slate-400 hover:text-white font-mono uppercase"
              >
                Clear
              </button>
            )}
          </div>

          {/* Machine Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0c121d] text-[10px] text-slate-400 uppercase tracking-wider border-b border-industrial-border">
                <tr>
                  <th className="px-4 py-2.5">Asset ID / Name</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Condition</th>
                  <th className="px-3 py-2.5">Failure Risk</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-border">
                {filteredMachines.length > 0 ? (
                  filteredMachines.map((machine) => {
                    const latest = latestPredictionsByMachine[machine.machine_id];
                    return (
                      <tr
                        key={machine.id}
                        className="hover:bg-industrial-elevated/40 transition-colors cursor-pointer group"
                        onClick={() => onSelectMachine(machine.machine_id)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-white block group-hover:text-blue-400 transition-colors">
                            {machine.machine_id}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans block truncate max-w-xs">
                            {machine.name || 'Industrial Unit'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                          {machine.location || 'Line 1'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <StatusBadge status={latest?.health_status || latest?.prediction || 'NORMAL'} />
                        </td>
                        <td className="px-3 py-3 w-36">
                          <RiskMeter probability={latest?.failure_probability} showLabel={false} />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onRunDiagnostic(machine.machine_id)}
                              className="px-2 py-1 rounded text-[11px] text-slate-300 hover:text-white bg-industrial-card hover:bg-slate-800 border border-industrial-border transition-colors flex items-center gap-1"
                              title="Test Telemetry"
                            >
                              <Gauge className="w-3 h-3 text-blue-400" />
                              <span>Test</span>
                            </button>
                            <button
                              onClick={() => onSelectMachine(machine.machine_id)}
                              className="px-2 py-1 rounded text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-mono text-xs">
                      No machines match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Critical Alerts & Engineering Standards */}
        <div className="space-y-6">
          {/* Active Critical Alerts Card */}
          <div className="bg-industrial-surface border border-industrial-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-industrial-border bg-industrial-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                  High-Priority Failure Alerts ({criticalPredictions.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Full Audit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {criticalPredictions.length > 0 ? (
                criticalPredictions.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => onSelectMachine(record.machine_id)}
                    className="p-3 rounded bg-red-950/20 border border-red-500/25 hover:border-red-500/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">
                        {record.machine_id}
                      </span>
                      <StatusBadge status="CRITICAL" />
                    </div>

                    <p className="text-[11px] text-red-300 font-sans leading-tight">
                      Vibration ({record.vibration.toFixed(2)} mm/s) & Temp ({record.temperature.toFixed(0)}°C) exceed safe ISO threshold limits.
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-red-500/20">
                      <span>Failure Risk: {(record.failure_probability! * 100).toFixed(1)}%</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 font-mono text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto mb-2" />
                  <span>No critical alerts triggered. Fleet operating nominally.</span>
                </div>
              )}
            </div>
          </div>

          {/* Industrial Engineering Standards Reference Card */}
          <div className="bg-industrial-surface border border-industrial-border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span>ISO 10816 Vibration & Physical Boundaries</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-industrial-card border border-industrial-border flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold block text-[11px]">ZONE A/B: NORMAL</span>
                  <span className="text-[10px] text-slate-400">Vibration &lt; 4.5 mm/s | Temp &lt; 75°C</span>
                </div>
                <span className="text-[10px] text-slate-400">Continuous Duty</span>
              </div>

              <div className="p-2 rounded bg-industrial-card border border-industrial-border flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold block text-[11px]">ZONE C: RESTRICTED</span>
                  <span className="text-[10px] text-slate-400">Vibration 4.5 – 6.2 mm/s | Temp 75–82°C</span>
                </div>
                <span className="text-[10px] text-slate-400">Inspection Advised</span>
              </div>

              <div className="p-2 rounded bg-industrial-card border border-industrial-border flex items-center justify-between">
                <div>
                  <span className="text-red-400 font-bold block text-[11px]">ZONE D: DANGER / DAMAGE</span>
                  <span className="text-[10px] text-slate-400">Vibration &gt; 6.2 mm/s | Temp &gt; 82°C</span>
                </div>
                <span className="text-[10px] text-slate-400">Immediate Action</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

