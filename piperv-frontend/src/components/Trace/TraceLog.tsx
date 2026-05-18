import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const TraceLog: React.FC = () => {
  const { history } = useSimulatorStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-2 border-b border-border bg-background/50">
        <span className="font-semibold text-sm">Trace Log</span>
      </div>
      
      <div className="flex-1 overflow-auto p-4 text-sm text-text-secondary">
        [Instruction Trace Log Placeholder]
        <br/>
        History length: {history.length}
      </div>
    </div>
  );
};
