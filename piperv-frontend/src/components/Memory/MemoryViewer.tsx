import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const MemoryViewer: React.FC = () => {
  const { state } = useSimulatorStore();
  const memory = state?.memory || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-2 border-b border-border bg-background/50 flex justify-between items-center">
        <span className="font-semibold text-sm">Memory</span>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {memory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm">
            Memory is empty.
          </div>
        ) : (
          <table className="w-full text-sm font-mono text-left">
            <thead className="text-text-secondary sticky top-0 bg-surface">
              <tr>
                <th className="font-normal py-1">Address</th>
                <th className="font-normal py-1">Value (Hex)</th>
                <th className="font-normal py-1">Value (Dec)</th>
              </tr>
            </thead>
            <tbody>
              {memory.map((entry) => (
                <tr key={entry.addr} className="hover:bg-border/50 border-b border-border/30 last:border-0">
                  <td className="py-1 text-active">0x{(entry.addr >>> 0).toString(16).padStart(4, '0')}</td>
                  <td className="py-1">0x{(entry.value >>> 0).toString(16).padStart(8, '0')}</td>
                  <td className="py-1">{entry.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
