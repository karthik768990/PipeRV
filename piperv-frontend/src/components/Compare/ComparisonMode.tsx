import React from 'react';

export const ComparisonMode: React.FC = () => {
  return (
    <div className="p-4 border border-border rounded bg-surface">
      <h2 className="text-lg font-bold mb-2">Comparison Mode (Forwarding ON vs OFF)</h2>
      <div className="flex gap-4">
        <div className="flex-1 bg-background p-2 rounded border border-border">
          <div className="font-bold text-center border-b border-border pb-2 mb-2 text-active">Forwarding ON</div>
          {/* Render another simulator instance or static comparison data */}
        </div>
        <div className="flex-1 bg-background p-2 rounded border border-border">
          <div className="font-bold text-center border-b border-border pb-2 mb-2 text-warning">Forwarding OFF</div>
          {/* Render another simulator instance or static comparison data */}
        </div>
      </div>
    </div>
  );
};
