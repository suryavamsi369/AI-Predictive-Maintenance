import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Database,
  Gauge,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { Machine, MachineSensorData, PredictionResponse } from '../../types';
import { RiskMeter } from '../common/RiskMeter';
import { StatusBadge } from '../common/StatusBadge';

interface DiagnosticsTabProps {
  machines: Machine[];
  prefilledMachineId?: string | null;
  onPredictionComplete: (result: PredictionResponse) => void;
  onError: (msg: string) => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
  machines,
  prefilledMachineId,
  onPredictionComplete,
  onError,
}) => {
  const [telemetry, setTelemetry] = useState<MachineSensorData>({
    machine_id: prefilledMachineId || 'Machine_04',
    temperature: 87,
    vibration: 8.4,
    pressure: 121,
    rpm: 2950,
    operating_hours: 8420,
  });

  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    if (prefilledMachineId) {
      setTelemetry((prev) => ({ ...prev, machine_id: prefilledMachineId }));
    }
  }, [prefilledMachineId]);

  const presets = [
    {
      name: 'Machine_04 (Critical Alert)',
      description: 'Severe bearing vibration & high thermal stress',
      data: {
        machine_id: 'Machine_04',
        temperature: 87,
        vibration: 8.4,
        pressure: 121,
        rpm: 2950,
        operating_hours: 8420,
      },
    },
    {
      name: 'Machine_01 (Nominal Baseline)',
      description: 'Optimal continuous operating parameters',
      data: {
        machine_id: 'Machine_01',
        temperature: 54,
        vibration: 1.6,
        pressure: 98,
        rpm: 2900,
        operating_hours: 1200,
      },
    },
    {
      name: 'Bearing Defect Simulation',
      description: 'Severe ISO Zone D vibration velocity spike',
      data: {
        machine_id: telemetry.machine_id || 'Machine_02',
        temperature: 68,
        vibration: 7.9,
        pressure: 102,
        rpm: 3050,
        operating_hours: 5400,
      },
    },
    {
      name: 'Thermal Overheat Condition',
      description: 'Coolant breakdown with temperature > 85°C',
      data: {
        machine_id: telemetry.machine_id || 'Machine_03',
        temperature: 92,
        vibration: 3.4,
        pressure: 108,
        rpm: 2850,
        operating_hours: 4100,
      },
    },
  ];

  const handleRunPrediction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!telemetry.machine_id.trim()) {
      onError('Please enter or select a valid Machine ID.');
      return;
    }

    try {
      setIsEvaluating(true);
      const res = await api.runPrediction(telemetry);
      setResult(res);
      onPredictionComplete(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inference request failed.';
      onError(msg);
    } finally {
      setIsEvaluating(false);
    }
  };

  const loadPreset = (presetData: MachineSensorData) => {
    setTelemetry({ ...presetData });
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="p-4 rounded-lg bg-industrial-surface border border-industrial-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span>Industrial Sensor Telemetry Ingestion & Real-Time Inference</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Submit machine telemetry to execute Random Forest failure forecasting. Successful predictions are automatically recorded to PostgreSQL.
          </p>
        </div>

        {/* Quick presets bar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Presets:</span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadPreset(p.data)}
              className="px-2.5 py-1 rounded bg-industrial-card hover:bg-industrial-elevated border border-industrial-border text-slate-300 hover:text-white text-[11px] font-mono transition-colors"
              title={p.description}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Input Controls vs Output Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Sensor Controls */}
        <form
          onSubmit={handleRunPrediction}
          className="lg:col-span-7 bg-industrial-surface border border-industrial-border rounded-lg p-5 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-industrial-border">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Machine & Sensor Parameters</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              PHYSICAL BOUNDS ENFORCED
            </span>
          </div>

          {/* Machine Selection */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium mb-1">
              Target Machine ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={telemetry.machine_id}
                onChange={(e) => setTelemetry({ ...telemetry, machine_id: e.target.value })}
                placeholder="e.g. Machine_04"
                className="flex-1 px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {machines.length > 0 && (
                <select
                  value={telemetry.machine_id}
                  onChange={(e) => setTelemetry({ ...telemetry, machine_id: e.target.value })}
                  className="px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="" disabled>Select registered machine...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.machine_id}>
                      {m.machine_id} ({m.name || 'Unit'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Sensor 1: Temperature */}
          <div className="p-3.5 rounded bg-industrial-card border border-industrial-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">Operating Temperature</span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Thermal Sensor (°C) — ISO Safe Limit: &lt; 82°C
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="-20"
                  max="150"
                  value={telemetry.temperature}
                  onChange={(e) => setTelemetry({ ...telemetry, temperature: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 rounded bg-[#0b101c] border border-industrial-border text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-400">°C</span>
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="130"
              step="0.5"
              value={telemetry.temperature}
              onChange={(e) => setTelemetry({ ...telemetry, temperature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>20°C (Cold)</span>
              <span className="text-emerald-400 font-medium">60°C (Nominal)</span>
              <span className="text-amber-400 font-medium">78°C (Warning)</span>
              <span className="text-red-400 font-medium">130°C (Overheat)</span>
            </div>
          </div>

          {/* Sensor 2: Vibration Velocity */}
          <div className="p-3.5 rounded bg-industrial-card border border-industrial-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">Vibration Amplitude</span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  ISO 10816 Velocity (mm/s) — Critical Zone: &gt; 6.2 mm/s
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="25.0"
                  value={telemetry.vibration}
                  onChange={(e) => setTelemetry({ ...telemetry, vibration: parseFloat(e.target.value) || 0 })}
                  className="w-20 px-2 py-1 rounded bg-[#0b101c] border border-industrial-border text-right text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-400">mm/s</span>
              </div>
            </div>
            <input
              type="range"
              min="0.2"
              max="15.0"
              step="0.1"
              value={telemetry.vibration}
              onChange={(e) => setTelemetry({ ...telemetry, vibration: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-medium">&lt; 2.8 (Good)</span>
              <span className="text-emerald-400 font-medium">2.8-4.5 (Acceptable)</span>
              <span className="text-amber-400 font-medium">4.5-6.2 (Warning)</span>
              <span className="text-red-400 font-medium">&gt; 6.2 (Danger)</span>
            </div>
          </div>

          {/* Dual Row: Pressure & RPM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Pressure */}
            <div className="p-3.5 rounded bg-industrial-card border border-industrial-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">Pressure</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Nominal: ~100 psi</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="1"
                    min="30"
                    max="200"
                    value={telemetry.pressure}
                    onChange={(e) => setTelemetry({ ...telemetry, pressure: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-1.5 py-0.5 rounded bg-[#0b101c] border border-industrial-border text-right text-xs font-mono font-bold text-white"
                  />
                  <span className="text-[11px] font-mono text-slate-400">psi</span>
                </div>
              </div>
              <input
                type="range"
                min="40"
                max="180"
                step="1"
                value={telemetry.pressure}
                onChange={(e) => setTelemetry({ ...telemetry, pressure: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Rotational Speed RPM */}
            <div className="p-3.5 rounded bg-industrial-card border border-industrial-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white">Rotational Speed</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Rated: ~2900 RPM</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="50"
                    min="500"
                    max="5000"
                    value={telemetry.rpm}
                    onChange={(e) => setTelemetry({ ...telemetry, rpm: parseFloat(e.target.value) || 0 })}
                    className="w-20 px-1.5 py-0.5 rounded bg-[#0b101c] border border-industrial-border text-right text-xs font-mono font-bold text-white"
                  />
                  <span className="text-[11px] font-mono text-slate-400">RPM</span>
                </div>
              </div>
              <input
                type="range"
                min="1200"
                max="4200"
                step="50"
                value={telemetry.rpm}
                onChange={(e) => setTelemetry({ ...telemetry, rpm: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="p-3.5 rounded bg-industrial-card border border-industrial-border space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">Cumulative Operating Hours</span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Fatigue threshold: &gt; 7,500 hrs increases wear rate
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="100"
                  min="0"
                  max="50000"
                  value={telemetry.operating_hours}
                  onChange={(e) => setTelemetry({ ...telemetry, operating_hours: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-2 py-1 rounded bg-[#0b101c] border border-industrial-border text-right text-xs font-mono font-bold text-white"
                />
                <span className="text-xs font-mono text-slate-400">hrs</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="16000"
              step="100"
              value={telemetry.operating_hours}
              onChange={(e) => setTelemetry({ ...telemetry, operating_hours: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isEvaluating}
            className="w-full py-2.5 px-4 rounded bg-industrial-accent hover:bg-industrial-accent-hover text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>EXECUTING RANDOM FOREST INFERENCE...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>EXECUTE PREDICTIVE MAINTENANCE INFERENCE</span>
              </>
            )}
          </button>
        </form>

        {/* Right Column (5 cols): Diagnostic Results */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-industrial-surface border border-industrial-border rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-industrial-border bg-industrial-card flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Diagnostic Assessment Output</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>POSTGRES PERSISTED</span>
              </span>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {result ? (
                <>
                  {/* Health Banner */}
                  <div
                    className={`p-4 rounded-md border flex items-start gap-3.5 ${
                      (result.failure_probability || 0) >= 0.65 || (result.health_status || '').includes('Critical')
                        ? 'bg-red-500/10 border-red-500/30'
                        : (result.failure_probability || 0) >= 0.30
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    {(result.failure_probability || 0) >= 0.65 ? (
                      <AlertOctagon className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                    ) : (result.failure_probability || 0) >= 0.30 ? (
                      <Activity className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={result.health_status || result.prediction} size="md" />
                        <span className="text-xs font-mono font-bold text-white uppercase">
                          {result.prediction}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {result.message}
                      </p>
                    </div>
                  </div>

                  {/* Failure Risk Probability Progress */}
                  <div className="p-4 rounded bg-industrial-card border border-industrial-border space-y-2">
                    <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider block">
                      Failure-Risk Probability Score
                    </span>
                    <RiskMeter probability={result.failure_probability} />
                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      Calculated by Random Forest ensemble class probability across 150 decision trees.
                    </p>
                  </div>

                  {/* Physical Degradation Analysis Breakdown */}
                  <div className="p-4 rounded bg-industrial-card border border-industrial-border space-y-2 text-xs font-mono">
                    <span className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold block">
                      Physical Boundary Analysis
                    </span>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Vibration (ISO 10816):</span>
                        <span
                          className={`font-bold ${
                            telemetry.vibration > 6.2
                              ? 'text-red-400'
                              : telemetry.vibration > 4.5
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {telemetry.vibration.toFixed(2)} mm/s ({telemetry.vibration > 6.2 ? 'DANGER ZONE' : telemetry.vibration > 4.5 ? 'WARNING' : 'ACCEPTABLE'})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Operating Temperature:</span>
                        <span
                          className={`font-bold ${
                            telemetry.temperature > 82
                              ? 'text-red-400'
                              : telemetry.temperature > 74
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {telemetry.temperature.toFixed(1)}°C ({telemetry.temperature > 82 ? 'OVERHEAT' : telemetry.temperature > 74 ? 'ELEVATED' : 'NOMINAL'})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Pressure Load:</span>
                        <span
                          className={`font-bold ${
                            telemetry.pressure > 125 ? 'text-red-400' : 'text-slate-200'
                          }`}
                        >
                          {telemetry.pressure.toFixed(0)} psi ({telemetry.pressure > 125 ? 'HIGH STRAIN' : 'NORMAL'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Machine & Persistence Receipt */}
                  <div className="p-3 rounded bg-[#0b101d] border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>ASSET ID:</span>
                      <span className="text-white font-bold">{result.received_data.machine_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>MODEL STATUS:</span>
                      <span className="text-emerald-400">{result.model_status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>DATABASE COMMIT:</span>
                      <span className={result.status === 'success' ? 'text-blue-400 font-semibold' : 'text-amber-400 font-semibold'}>
                        {result.status === 'success' ? 'RECORD AUTO-PERSISTED' : 'UNCOMMITTED (FALLBACK)'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 font-mono space-y-3">
                  <div className="w-12 h-12 rounded-full bg-industrial-card border border-industrial-border flex items-center justify-center text-slate-500">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                      Ready for Live Inference
                    </span>
                    <span className="text-[11px] text-slate-500 block max-w-xs mt-1">
                      Configure sensor telemetry sliders on the left or select a preset, then execute inference.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
