import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const AssemblyEditor: React.FC = () => {
  const { loadProgram, isRunning } = useSimulatorStore();
  const [code, setCode] = useState<string>('ADD x1, x2, x3\nLW x4, 0(x1)\nSW x4, 4(x1)');

  const handleAssemble = () => {
    // For now, load program with empty memory
    loadProgram(code, []);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-2 border-b border-border flex justify-between items-center bg-background/50">
        <span className="font-semibold text-sm">Assembly Editor</span>
        <button 
          onClick={handleAssemble}
          disabled={isRunning}
          className="px-3 py-1 bg-active text-background text-sm font-bold rounded hover:bg-opacity-90 disabled:opacity-50 transition"
        >
          Assemble
        </button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="plaintext" // We can register custom RISC-V syntax later
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            readOnly: isRunning
          }}
        />
      </div>
    </div>
  );
};
