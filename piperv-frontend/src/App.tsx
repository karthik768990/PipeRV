import React, { useEffect } from 'react';
import { AssemblyEditor } from './components/Editor/AssemblyEditor';
import { PipelineDiagram } from './components/Pipeline/PipelineDiagram';
import { SpaceTimeDiagram } from './components/Pipeline/SpaceTimeDiagram';
import { RegisterFile } from './components/RegisterFile/RegisterFile';
import { MemoryViewer } from './components/Memory/MemoryViewer';
import { ControlPanel } from './components/Controls/ControlPanel';
import { StatsDashboard } from './components/Stats/StatsDashboard';
import { TraceLog } from './components/Trace/TraceLog';
import { IpcWarningBanner } from './components/shared/IpcWarningBanner';
import { useUiStore } from './store/uiStore';
import './theme/global.css';

function App() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <header className="flex-none h-14 border-b border-border bg-surface px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-active flex items-center justify-center text-background font-bold text-xl">P</div>
          <h1 className="text-xl font-bold tracking-tight">PipeRV</h1>
          <span className="text-sm text-text-secondary px-2 border-l border-border ml-2">RISC-V 5-Stage Simulator</span>
        </div>
        <ControlPanel />
      </header>

      <IpcWarningBanner />

      <main className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
        {/* Top half: Editor and Pipeline */}
        <div className="flex-1 flex gap-4 min-h-[400px]">
          <div className="w-1/3 flex flex-col gap-4">
            <div className="flex-1 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
              <AssemblyEditor />
            </div>
          </div>
          
          <div className="w-2/3 flex flex-col gap-4">
            <div className="h-1/2 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border bg-background/50 font-semibold text-sm">Pipeline Architecture</div>
              <div className="flex-1 p-4 flex items-center justify-center relative">
                <PipelineDiagram />
              </div>
            </div>
            
            <div className="h-1/2 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border bg-background/50 font-semibold text-sm flex justify-between">
                <span>Space-Time Diagram</span>
              </div>
              <div className="flex-1 overflow-auto">
                <SpaceTimeDiagram />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom half: Registers, Memory, Stats, Trace */}
        <div className="flex-[0.8] flex gap-4 min-h-[300px]">
          <div className="w-1/4 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
            <RegisterFile />
          </div>
          
          <div className="w-1/4 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
            <MemoryViewer />
          </div>
          
          <div className="w-1/4 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
            <StatsDashboard />
          </div>

          <div className="w-1/4 bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
            <TraceLog />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
