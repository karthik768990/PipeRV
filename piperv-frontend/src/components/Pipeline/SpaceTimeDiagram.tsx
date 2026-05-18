import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const SpaceTimeDiagram: React.FC = () => {
  const { history } = useSimulatorStore();
  
  // This is a placeholder. 
  // For a real space-time diagram, we need to track instructions per cycle.
  // The history gives us the state at each cycle.
  
  return (
    <div className="p-4 text-sm text-text-secondary">
      [Space-Time Diagram Placeholder]
      <br/>
      Total cycles recorded: {history.length}
    </div>
  );
};
