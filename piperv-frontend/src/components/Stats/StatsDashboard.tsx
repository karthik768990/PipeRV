import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const StatsDashboard: React.FC = () => {
  const { state } = useSimulatorStore();
  const stats = state?.stats;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-2 border-b border-border bg-background/50">
        <span className="font-semibold text-sm">Statistics</span>
      </div>
      
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded p-3 flex flex-col items-center">
                <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">Cycles</span>
                <span className="text-2xl font-mono mt-1 text-active">{stats.cycle_count}</span>
              </div>
              <div className="bg-background border border-border rounded p-3 flex flex-col items-center">
                <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">Instructions</span>
                <span className="text-2xl font-mono mt-1 text-clean">{stats.instruction_count}</span>
              </div>
              <div className="bg-background border border-border rounded p-3 flex flex-col items-center">
                <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">Stalls</span>
                <span className="text-2xl font-mono mt-1 text-hazard">{stats.stall_count}</span>
              </div>
              <div className="bg-background border border-border rounded p-3 flex flex-col items-center">
                <span className="text-text-secondary text-xs uppercase font-bold tracking-wider">IPC</span>
                <span className={`text-2xl font-mono mt-1 ${stats.ipc > 1.0 ? 'text-hazard animate-pulse' : 'text-active'}`}>
                  {stats.ipc.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Placeholder for charts */}
            <div className="flex-1 bg-background border border-border rounded flex items-center justify-center text-text-secondary text-xs">
              [ Charts ]
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            Run simulation to see stats.
          </div>
        )}
      </div>
    </div>
  );
};
