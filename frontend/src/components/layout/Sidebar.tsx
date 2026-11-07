import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Gauge,
  History,
  LayoutDashboard,
  Server,
  Sliders,
} from 'lucide-react';
import { ViewTab } from '../../types';

interface SidebarProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  fleetCount: number;
  criticalCount: number;
  modelLoaded: boolean;
  backendConnected?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  fleetCount,
  criticalCount,
  modelLoaded,
  backendConnected = true,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'overview' as ViewTab,
      label: 'Fleet Overview',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      badge: criticalCount > 0 ? `${criticalCount} ALERT` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    {
      id: 'diagnostics' as ViewTab,
      label: 'Live Diagnostics',
      icon: <Gauge className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'fleet' as ViewTab,
      label: 'Machine Fleet',
      icon: <Cpu className="w-4 h-4 shrink-0" />,
      badge: fleetCount > 0 ? `${fleetCount}` : undefined,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'history' as ViewTab,
      label: 'Prediction History',
      icon: <History className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'model' as ViewTab,
      label: 'ML Model Engine',
      icon: <Activity className="w-4 h-4 shrink-0" />,
      badge: modelLoaded ? 'ACTIVE' : 'OFFLINE',
      badgeColor: modelLoaded
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-red-500/10 text-red-400 border-red-500/30',
    },
  ];

  return (
    <aside className="w-64 bg-industrial-surface border-r border-industrial-border flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Product Brand Header */}
        <div className="h-14 px-4 border-b border-industrial-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-industrial-accent flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-white block">
                APM SUITE <span className="text-[10px] text-industrial-muted font-mono font-normal">v2.1</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide block leading-none">
                PREDICTIVE MAINTENANCE
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Normal" />
        </div>

        {/* Section: Navigation */}
        <div className="p-3">
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-2">
            Operations Console
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-industrial-card text-white border border-industrial-border shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-industrial-card/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-industrial-accent' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-medium ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-industrial-border bg-[#0d131f]/70 text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-slate-500" />
            <span>CORE BACKEND</span>
          </span>
          <span
            className={`font-semibold text-[10px] ${
              backendConnected ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {backendConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-slate-500" />
            <span>POSTGRESQL</span>
          </span>
          <span
            className={`text-[10px] ${
              backendConnected ? 'text-slate-300' : 'text-red-400'
            }`}
          >
            {backendConnected ? 'SYNCED' : 'OFFLINE'}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400 text-[10px]">
          <span>SYSTEM CLOCK</span>
          <span className="text-slate-200">{utcTime || 'SYNCING...'}</span>
        </div>
      </div>
    </aside>
  );
};

