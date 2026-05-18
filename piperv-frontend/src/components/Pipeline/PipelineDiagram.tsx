import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const PipelineDiagram: React.FC = () => {
  const { state } = useSimulatorStore();
  
  const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'] as const;
  
  return (
    <div className="flex items-center justify-between w-full max-w-3xl gap-4">
      {stages.map((stage) => {
        const stageState = state?.pipeline[stage];
        const isActive = stageState && stageState.opcode !== 'NOP';
        const isStalled = stageState?.stalled;
        
        let borderClass = 'border-border';
        let bgClass = 'bg-surface';
        
        if (isStalled) {
          borderClass = 'border-hazard animate-pulse shadow-[0_0_15px_rgba(255,71,87,0.3)]';
        } else if (isActive) {
          borderClass = 'border-active shadow-[0_0_15px_rgba(0,229,255,0.2)]';
        }

        return (
          <div key={stage} className={`flex-1 min-w-[120px] aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-2 transition-all duration-300 ${borderClass} ${bgClass}`}>
            <div className="text-xl font-bold mb-2 text-text-secondary">{stage}</div>
            {stageState ? (
              <div className="text-sm font-mono text-center flex flex-col gap-1">
                <span className={isActive ? 'text-text-primary' : 'text-text-secondary'}>
                  {stageState.instruction}
                </span>
                {isStalled && <span className="text-xs text-hazard font-bold">STALLED</span>}
              </div>
            ) : (
              <span className="text-text-secondary text-sm font-mono">NOP</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
