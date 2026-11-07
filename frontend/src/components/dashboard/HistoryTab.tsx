import React, { useState } from 'react';
import { Download, History, Search } from 'lucide-react';
import { PredictionRecord } from '../../types';
import { RiskMeter } from '../common/RiskMeter';
import { StatusBadge } from '../common/StatusBadge';

interface HistoryTabProps {
  predictions: PredictionRecord[];
  onSelectMachine: (machineId: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ predictions, onSelectMachine }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY'>('ALL');

  const filteredRecords = predictions.filter((p) => {
    const matchesSearch = p.machine_id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterCondition === 'ALL') return true;
    const condStr = (p.health_status || p.prediction || '').toUpperCase();

    if (filterCondition === 'CRITICAL') {
      return condStr.includes('CRITICAL') || condStr.includes('MAINTENANCE');
    }
    if (filterCondition === 'WARNING') {
      return condStr.includes('WARNING') || condStr.includes('MODERATE');
    }
    if (filterCondition === 'HEALTHY') {
      return condStr.includes('HEALTHY') || condStr.includes('NORMAL');
    }
    return true;
  });

  const exportToCsv = () => {
    if (predictions.length === 0) return;

    const headers = [
      'Record ID',
      'Timestamp',
      'Machine ID',
      'Temperature (C)',
      'Vibration (mm/s)',
      'Pressure (psi)',
      'RPM',
      'Operating Hours',
      'Prediction',
      'Health Status',
      'Failure Probability',
      'Risk Level',
    ];

    const rows = predictions.map((p) => [
      p.id,
      `"${p.timestamp}"`,
      `"${p.machine_id}"`,
      p.temperature,
      p.vibration,
      p.pressure,
      p.rpm,
      p.operating_hours,
      `"${p.prediction}"`,
      `"${p.health_status || ''}"`,
      p.failure_probability !== null ? p.failure_probability : '',
      `"${p.risk_level || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `apm_telemetry_audit_${new Date().toISOString().substring(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="p-4 rounded-lg bg-industrial-surface border border-industrial-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <span>Telemetry & Predictive Assessment Audit Trail ({predictions.length} Total Logs)</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Immutable historical record of all ingested sensor parameters and evaluated machine health predictions.
          </p>
        </div>

        <button
          onClick={exportToCsv}
          disabled={predictions.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-200 bg-industrial-card hover:bg-industrial-elevated border border-industrial-border transition-colors disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* History Log Table */}
      <div className="bg-industrial-surface border border-industrial-border rounded-lg overflow-hidden flex flex-col">
        {/* Controls */}
        <div className="p-3.5 border-b border-industrial-border bg-industrial-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Machine ID (e.g. Machine_04)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded bg-industrial-surface border border-industrial-border text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            {(['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterCondition(filter)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium uppercase transition-colors ${
                  filterCondition === filter
                    ? 'bg-industrial-elevated text-white border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b101c] text-[10px] text-slate-400 uppercase tracking-wider border-b border-industrial-border">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-3 py-3">Machine ID</th>
                <th className="px-3 py-3">Temp (°C)</th>
                <th className="px-3 py-3">Vibration</th>
                <th className="px-3 py-3">Pressure</th>
                <th className="px-3 py-3">RPM</th>
                <th className="px-3 py-3">Hours</th>
                <th className="px-3 py-3">Assessment</th>
                <th className="px-4 py-3">Failure Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-industrial-elevated/40 transition-colors cursor-pointer group"
                    onClick={() => onSelectMachine(rec.machine_id)}
                  >
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(rec.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                        {rec.machine_id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-white">
                      <span
                        className={
                          rec.temperature > 82
                            ? 'text-red-400 font-bold'
                            : rec.temperature > 74
                            ? 'text-amber-400 font-medium'
                            : 'text-slate-200'
                        }
                      >
                        {rec.temperature.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={
                          rec.vibration > 6.2
                            ? 'text-red-400 font-bold'
                            : rec.vibration > 4.5
                            ? 'text-amber-400 font-medium'
                            : 'text-slate-200'
                        }
                      >
                        {rec.vibration.toFixed(2)} mm/s
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {rec.pressure.toFixed(0)} psi
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {rec.rpm.toFixed(0)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                      {rec.operating_hours.toFixed(0)} hrs
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={rec.health_status || rec.prediction} />
                    </td>
                    <td className="px-4 py-2.5 w-36">
                      <RiskMeter probability={rec.failure_probability} showLabel={false} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500 font-mono text-xs">
                    No historical prediction records found matching the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

