import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { Play, FastForward, Pause, RotateCcw } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';

export const ControlPanel: React.FC = () => {
  const { step, run, pause, reset, isRunning, isReady, speedMs, setSpeed } = useSimulatorStore();

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-background p-1 rounded border border-border">
        <button 
          onClick={step} 
          disabled={!isReady || isRunning}
          className="p-1.5 bg-surface text-active rounded hover:bg-border disabled:opacity-50 transition"
          title="Step (1 Cycle)"
        >
          <Play size={18} />
        </button>
        <button 
          onClick={run} 
          disabled={!isReady || isRunning}
          className="p-1.5 bg-surface text-active rounded hover:bg-border disabled:opacity-50 transition"
          title="Run"
        >
          <FastForward size={18} />
        </button>
        <button 
          onClick={pause} 
          disabled={!isRunning}
          className="p-1.5 bg-surface text-warning rounded hover:bg-border disabled:opacity-50 transition"
          title="Pause"
        >
          <Pause size={18} />
        </button>
        <button 
          onClick={reset} 
          disabled={!isReady}
          className="p-1.5 bg-surface text-hazard rounded hover:bg-border disabled:opacity-50 transition"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="flex items-center space-x-2 text-sm">
        <span className="text-text-secondary">Speed:</span>
        <input 
          type="range" 
          min="10" 
          max="1000" 
          value={1010 - speedMs} 
          onChange={(e) => setSpeed(1010 - Number(e.target.value))}
          className="w-24 accent-active"
        />
      </div>

      <div className="h-6 w-px bg-border mx-2"></div>
      
      <ThemeToggle />
    </div>
  );
};
