import React, { useEffect, useState } from 'react';
import { Toast, ToastMessage } from './components/common/Toast';
import { DiagnosticsTab } from './components/dashboard/DiagnosticsTab';
import { FleetTab } from './components/dashboard/FleetTab';
import { HistoryTab } from './components/dashboard/HistoryTab';
import { ModelInfoTab } from './components/dashboard/ModelInfoTab';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MachineDetailDrawer } from './components/modals/MachineDetailDrawer';
import { RegisterMachineModal } from './components/modals/RegisterMachineModal';
import { api } from './services/api';
import { Machine, ModelInfo, PredictionRecord, PredictionResponse, ViewTab } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [diagnosticPrefillId, setDiagnosticPrefillId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      message,
    });
  };

  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [machinesRes, predictionsRes, modelRes] = await Promise.allSettled([
        api.getMachines(),
        api.getPredictions(undefined, 100),
        api.getModelInfo(),
      ]);

      const anySuccess =
        machinesRes.status === 'fulfilled' ||
        predictionsRes.status === 'fulfilled' ||
        modelRes.status === 'fulfilled';

      setBackendConnected(anySuccess);

      if (machinesRes.status === 'fulfilled') {
        setMachines(machinesRes.value);
      }
      if (predictionsRes.status === 'fulfilled') {
        setPredictions(predictionsRes.value);
      }
      if (modelRes.status === 'fulfilled') {
        setModelInfo(modelRes.value);
      }
    } catch (err: unknown) {
      setBackendConnected(false);
      const msg = err instanceof Error ? err.message : 'Error syncing telemetry data.';
      showToast('error', 'Sync Failure', msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
    // Background auto-sync every 30 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDetail = (machineId: string) => {
    setSelectedMachineId(machineId);
    setIsDetailDrawerOpen(true);
  };

  const handleRunDiagnosticForMachine = (machineId: string) => {
    setDiagnosticPrefillId(machineId);
    setActiveTab('diagnostics');
  };

  const handlePredictionComplete = (res: PredictionResponse) => {
    showToast(
      'success',
      'Telemetry Inference Logged',
      `Assessment for '${res.received_data.machine_id}': ${res.health_status || res.prediction} (${((res.failure_probability || 0) * 100).toFixed(1)}% risk). Persisted to database.`
    );
    // Refresh history and machine statistics immediately
    loadData(true);
  };

  const handleRegisterSuccess = (newMachineId: string) => {
    showToast('success', 'Asset Registered', `Machine '${newMachineId}' successfully added to industrial registry.`);
    loadData(true);
  };

  // Critical alerts count
  const criticalCount = predictions.filter(
    (p) => (p.failure_probability || 0) >= 0.65 || (p.health_status || '').includes('Critical')
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-industrial-bg font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        fleetCount={machines.length}
        criticalCount={criticalCount}
        modelLoaded={modelInfo?.model_loaded ?? true}
        backendConnected={backendConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onGoToDiagnostics={() => setActiveTab('diagnostics')}
          modelLoaded={modelInfo?.model_loaded ?? true}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 font-mono text-xs">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>INITIALIZING APM WORKSTATION...</span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  machines={machines}
                  predictions={predictions}
                  modelInfo={modelInfo}
                  onNavigateTab={setActiveTab}
                  onSelectMachine={handleOpenDetail}
                  onRunDiagnostic={handleRunDiagnosticForMachine}
                />
              )}

              {activeTab === 'diagnostics' && (
                <DiagnosticsTab
                  machines={machines}
                  prefilledMachineId={diagnosticPrefillId}
                  onPredictionComplete={handlePredictionComplete}
                  onError={(err) => showToast('error', 'Diagnostics Error', err)}
                />
              )}

              {activeTab === 'fleet' && (
                <FleetTab
                  machines={machines}
                  onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                  onSelectMachine={handleOpenDetail}
                  onRunDiagnostic={handleRunDiagnosticForMachine}
                />
              )}

              {activeTab === 'history' && (
                <HistoryTab
                  predictions={predictions}
                  onSelectMachine={handleOpenDetail}
                />
              )}

              {activeTab === 'model' && (
                <ModelInfoTab modelInfo={modelInfo} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Machine Detail Drawer */}
      <MachineDetailDrawer
        machineId={selectedMachineId}
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedMachineId(null);
        }}
        onRunDiagnostic={handleRunDiagnosticForMachine}
      />

      {/* Register Machine Modal */}
      <RegisterMachineModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
        onError={(err) => showToast('error', 'Registration Error', err)}
      />

      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;

