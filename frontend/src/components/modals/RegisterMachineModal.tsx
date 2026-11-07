import React, { useState } from 'react';
import { AlertCircle, Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import { MachineCreate } from '../../types';

interface RegisterMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMachineId: string) => void;
  onError: (errorMsg: string) => void;
}

export const RegisterMachineModal: React.FC<RegisterMachineModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<MachineCreate>({
    machine_id: '',
    name: '',
    model_type: '',
    location: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const machineId = formData.machine_id.trim();
    if (!machineId) {
      setFormError('Machine ID is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.registerMachine({
        ...formData,
        machine_id: machineId,
      });
      onSuccess(machineId);
      onClose();
      setFormData({
        machine_id: '',
        name: '',
        model_type: '',
        location: '',
        status: 'active',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register machine.';
      setFormError(msg);
      onError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="bg-industrial-surface border border-industrial-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-industrial-border flex items-center justify-between bg-industrial-card">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight uppercase">
              Register Industrial Asset
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="flex items-start gap-2.5 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium mb-1">
              Machine ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Machine_05"
              value={formData.machine_id}
              onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
              className="w-full px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 transition-colors"
            />
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              Unique asset code for telemetry association
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium mb-1">
              Asset Name / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Centrifugal Slurry Pump #5"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium mb-1">
                Model Classification
              </label>
              <input
                type="text"
                placeholder="e.g. Pump-X300"
                value={formData.model_type || ''}
                onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
                className="w-full px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium mb-1">
                Operational Status
              </label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="active">ACTIVE</option>
                <option value="maintenance">MAINTENANCE</option>
                <option value="standby">STANDBY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium mb-1">
              Facility / Bay Location
            </label>
            <input
              type="text"
              placeholder="e.g. Sector 2, Bay C, Line 4"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 rounded bg-industrial-card border border-industrial-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-industrial-border flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-industrial-accent hover:bg-industrial-accent-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'REGISTERING...' : 'REGISTER ASSET'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

