import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  let borderColor = 'border-slate-700';
  let icon = <Info className="w-4 h-4 text-blue-400 shrink-0" />;

  if (toast.type === 'success') {
    borderColor = 'border-emerald-500/40 bg-[#0e1e1a]';
    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
  } else if (toast.type === 'error') {
    borderColor = 'border-red-500/40 bg-[#1e0e11]';
    icon = <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
  } else {
    borderColor = 'border-blue-500/40 bg-[#0e1626]';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-start gap-3 p-3.5 rounded-md border shadow-xl ${borderColor} backdrop-blur-sm`}
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-industrial-text uppercase tracking-wide">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-xs text-slate-300 mt-0.5 break-words font-mono leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded hover:bg-slate-800"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

