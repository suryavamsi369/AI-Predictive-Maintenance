import React, { useState } from 'react';
import { Cpu, Gauge, MapPin, Plus, Search } from 'lucide-react';
import { Machine } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface FleetTabProps {
  machines: Machine[];
  onOpenRegisterModal: () => void;
  onSelectMachine: (machineId: string) => void;
  onRunDiagnostic: (machineId: string) => void;
}

export const FleetTab: React.FC<FleetTabProps> = ({
  machines,
  onOpenRegisterModal,
  onSelectMachine,
  onRunDiagnostic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.machine_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.model_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return m.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="p-4 rounded-lg bg-industrial-surface border border-industrial-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Industrial Equipment Registry ({machines.length} Total Assets)</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Registered industrial machines receiving telemetry and participating in predictive maintenance monitoring.
          </p>
        </div>

        <button
          onClick={onOpenRegisterModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold text-white bg-industrial-accent hover:bg-industrial-accent-hover transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Directory Table Card */}
      <div className="bg-industrial-surface border border-industrial-border rounded-lg overflow-hidden flex flex-col">
        {/* Controls: Search & Filter */}
        <div className="p-3.5 border-b border-industrial-border bg-industrial-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Machine ID, asset name, model, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded bg-industrial-surface border border-industrial-border text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {(['ALL', 'ACTIVE', 'MAINTENANCE', 'STANDBY'] as const).map((filter) => (
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b101c] text-[10px] text-slate-400 uppercase tracking-wider border-b border-industrial-border">
              <tr>
                <th className="px-4 py-3">Machine Identifier</th>
                <th className="px-4 py-3">Asset Name & Classification</th>
                <th className="px-4 py-3">Facility Location</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Registered Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border">
              {filteredMachines.length > 0 ? (
                filteredMachines.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-industrial-elevated/40 transition-colors cursor-pointer group"
                    onClick={() => onSelectMachine(m.machine_id)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold text-white block group-hover:text-blue-400 transition-colors">
                        {m.machine_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">ID #{m.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-200 font-sans font-medium block">
                        {m.name || 'Industrial Equipment Unit'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        Model: {m.model_type || 'General Machinery'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{m.location || 'Central Facility'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onRunDiagnostic(m.machine_id)}
                          className="px-2.5 py-1 rounded text-[11px] text-slate-300 hover:text-white bg-industrial-card hover:bg-slate-800 border border-industrial-border transition-colors flex items-center gap-1"
                        >
                          <Gauge className="w-3 h-3 text-blue-400" />
                          <span>Test</span>
                        </button>
                        <button
                          onClick={() => onSelectMachine(m.machine_id)}
                          className="px-2.5 py-1 rounded text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 font-mono text-xs">
                    No machine assets match the search criteria.
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

