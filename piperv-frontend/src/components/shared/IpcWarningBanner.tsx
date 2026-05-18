import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { AlertTriangle } from 'lucide-react';

export const IpcWarningBanner: React.FC = () => {
  const { state } = useSimulatorStore();
  
  if (!state || state.stats.ipc <= 1.0) return null;

  return (
    <div className="bg-[#ff4757] text-white px-4 py-2 flex items-center justify-center space-x-2 font-bold shadow-lg">
      <AlertTriangle size={20} />
      <span>⚠️ IPC > 1.0 detected — possible simulator corruption. Check pipeline logic.</span>
    </div>
  );
};
