import React from 'react';
import { Gauge, Plus, RefreshCw } from 'lucide-react';
import { ViewTab } from '../../types';

interface HeaderProps {
  activeTab: ViewTab;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenRegisterModal: () => void;
  onGoToDiagnostics: () => void;
  modelLoaded: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onRefresh,
  isRefreshing,
  onOpenRegisterModal,
  onGoToDiagnostics,
  modelLoaded,
}) => {
  const getTabTitle = (tab: ViewTab) => {
    switch (tab) {
      case 'overview':
        return { section: 'Operations', title: 'Fleet Telemetry Overview' };
      case 'diagnostics':
        return { section: 'Workstation', title: 'Live Telemetry Diagnostics & Inference' };
      case 'fleet':
        return { section: 'Assets', title: 'Machine Fleet Management' };
      case 'history':
        return { section: 'Audit', title: 'Prediction & Telemetry History Log' };
      case 'model':
        return { section: 'Engine', title: 'Random Forest Model Diagnostics & Metrics' };
    }
  };

  const { section, title } = getTabTitle(activeTab);

  return (
    <header className="h-14 px-6 border-b border-industrial-border bg-industrial-surface flex items-center justify-between shrink-0 select-none">
      {/* Title & Breadcrumb */}
      <div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          <span>APM</span>
          <span>/</span>
          <span>{section}</span>
        </div>
        <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      {/* Right Actions & Health Indicators */}
      <div className="flex items-center gap-3">
        {/* ML Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b101b] border border-industrial-border text-[11px] font-mono text-slate-300">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              modelLoaded ? 'bg-emerald-400' : 'bg-red-400'
            }`}
          />
          <span className="text-slate-400">MODEL:</span>
          <span className="font-semibold text-white">
            {modelLoaded ? 'RF-150 BALANCED' : 'UNAVAILABLE'}
          </span>
        </div>

        {/* Refresh Action Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-industrial-card border border-industrial-border transition-colors disabled:opacity-50"
          title="Refresh All Telemetry Data"
          aria-label="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Quick Diagnostics Action */}
        {activeTab !== 'diagnostics' && (
          <button
            onClick={onGoToDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-slate-200 bg-industrial-card hover:bg-industrial-elevated border border-industrial-border transition-colors shadow-sm"
          >
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>Run Diagnostics</span>
          </button>
        )}

        {/* Register Machine Action */}
        <button
          onClick={onOpenRegisterModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-white bg-industrial-accent hover:bg-industrial-accent-hover transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Machine</span>
        </button>
      </div>
    </header>
  );
};

