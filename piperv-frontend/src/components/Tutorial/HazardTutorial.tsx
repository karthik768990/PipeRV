import React from 'react';

export const HazardTutorial: React.FC = () => {
  return (
    <div className="p-4 border border-border rounded bg-surface mt-4">
      <h2 className="text-lg font-bold mb-2 text-active">Hazard Tutorial Mode</h2>
      <p className="text-sm text-text-secondary mb-4">
        Learn how pipeline hazards are detected and resolved. Select a scenario below:
      </p>
      <div className="flex gap-2">
        <button className="bg-background border border-active text-active px-3 py-1 rounded text-sm hover:bg-active/10 transition">RAW Hazard</button>
        <button className="bg-background border border-warning text-warning px-3 py-1 rounded text-sm hover:bg-warning/10 transition">Load-Use</button>
        <button className="bg-background border border-hazard text-hazard px-3 py-1 rounded text-sm hover:bg-hazard/10 transition">Cache Miss</button>
      </div>
    </div>
  );
};
