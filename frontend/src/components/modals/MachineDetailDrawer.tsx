import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Cpu,
  Gauge,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { MachineDetail, PredictionRecord } from '../../types';
import { RiskMeter } from '../common/RiskMeter';
import { StatusBadge } from '../common/StatusBadge';

interface MachineDetailDrawerProps {
  machineId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRunDiagnostic: (machineId: string) => void;
}

export const MachineDetailDrawer: React.FC<MachineDetailDrawerProps> = ({
  machineId,
  isOpen,
  onClose,
  onRunDiagnostic,
}) => {
  const [detail, setDetail] = useState<MachineDetail | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !machineId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getMachineDetails(machineId),
      api.getMachinePredictions(machineId).catch(() => []),
    ])
      .then(([detailData, historyData]) => {
        if (!isMounted) return;
        setDetail(detailData);
        setHistory(historyData);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load machine details.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, machineId]);

  if (!isOpen || !machineId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-industrial-surface border-l border-industrial-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-industrial-border flex items-center justify-between bg-industrial-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-industrial-elevated border border-industrial-border flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight font-mono">
                  {machineId}
                </h2>
                {detail && <StatusBadge status={detail.status} />}
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs">
                {detail?.name || 'Industrial Telemetry Asset'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3 font-mono text-xs">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              <span>FETCHING ASSET TELEMETRY...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Asset Metadata Grid */}
              <div className="bg-industrial-card border border-industrial-border rounded-md p-4 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Equipment Specifications
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Model Type</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {detail.model_type || 'Unspecified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <span className="text-slate-200 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {detail.location || 'Central Facility'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Registered Date</span>
                    <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(detail.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Inferences</span>
                    <span className="font-mono text-blue-400 font-bold">
                      {detail.total_predictions} Evaluations
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Inference Assessment */}
              <div className="bg-industrial-card border border-industrial-border rounded-md p-4 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Latest Inference Assessment
                </span>

                {detail.latest_prediction ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-industrial-border">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status={
                            detail.latest_prediction.health_status ||
                            detail.latest_prediction.prediction
                          }
                          size="md"
                        />
                        <span className="text-xs font-mono text-slate-300 font-semibold">
                          {detail.latest_prediction.prediction}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(detail.latest_prediction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Failure-Risk Probability
                      </span>
                      <RiskMeter probability={detail.latest_prediction.failure_probability} />
                    </div>

                    {/* Sensor snapshot at time of inference */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
                      <div className="p-2 rounded bg-industrial-surface border border-industrial-border">
                        <span className="text-[10px] text-slate-400 block">TEMP</span>
                        <span className="text-xs font-bold text-white">
                          {detail.latest_prediction.temperature.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="p-2 rounded bg-industrial-surface border border-industrial-border">
                        <span className="text-[10px] text-slate-400 block">VIBRATION</span>
                        <span className="text-xs font-bold text-white">
                          {detail.latest_prediction.vibration.toFixed(2)} mm/s
                        </span>
                      </div>
                      <div className="p-2 rounded bg-industrial-surface border border-industrial-border">
                        <span className="text-[10px] text-slate-400 block">PRESSURE</span>
                        <span className="text-xs font-bold text-white">
                          {detail.latest_prediction.pressure.toFixed(0)} psi
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono py-2">
                    No predictive assessments logged yet for this asset.
                  </p>
                )}
              </div>

              {/* Historical Log */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                  Recent Telemetry Audit Log ({history.length})
                </span>

                {history.length > 0 ? (
                  <div className="border border-industrial-border rounded-md overflow-hidden bg-industrial-card">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0e141f] text-[10px] text-slate-400 uppercase border-b border-industrial-border">
                        <tr>
                          <th className="px-3 py-2">Timestamp</th>
                          <th className="px-2 py-2">Temp</th>
                          <th className="px-2 py-2">Vib</th>
                          <th className="px-3 py-2 text-right">Condition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-industrial-border">
                        {history.slice(0, 8).map((rec) => (
                          <tr key={rec.id} className="hover:bg-industrial-elevated/50">
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-[11px]">
                              {new Date(rec.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-2 py-2 text-white">
                              {rec.temperature.toFixed(0)}°C
                            </td>
                            <td className="px-2 py-2 text-white">
                              {rec.vibration.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <StatusBadge status={rec.health_status || rec.prediction} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono">
                    No historical logs recorded.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-industrial-border bg-industrial-card shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            CLOSE
          </button>
          <button
            onClick={() => {
              onClose();
              onRunDiagnostic(machineId);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-xs font-semibold text-white bg-industrial-accent hover:bg-industrial-accent-hover transition-colors shadow-sm"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>RUN DIAGNOSTIC NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};

