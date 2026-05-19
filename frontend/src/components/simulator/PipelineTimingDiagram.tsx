"use client";

import React, { useRef, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

const STAGE_COLORS: Record<string, string> = {
  IF: '#3b82f6',   // blue
  ID: '#14b8a6',   // teal
  EX: '#f97316',   // orange
  MEM: '#a855f7',  // purple
  WB: '#22c55e',   // green
};

const STAGE_BG: Record<string, string> = {
  IF: 'rgba(59,130,246,0.25)',
  ID: 'rgba(20,184,166,0.25)',
  EX: 'rgba(249,115,22,0.25)',
  MEM: 'rgba(168,85,247,0.25)',
  WB: 'rgba(34,197,94,0.25)',
};

export default function PipelineTimingDiagram() {
  const { timingDiagram, cycle } = useSimulatorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const rowH = 24;
    const labelW = 160;
    const cellW = 40;
    const headerH = 28;

    // Calculate visible cycles
    const maxVisibleCycles = Math.floor((w - labelW) / cellW);
    const startCycle = Math.max(1, cycle - maxVisibleCycles + 2);
    const endCycle = startCycle + maxVisibleCycles;

    // Filter visible entries
    const entries = timingDiagram.filter(e =>
      e.stages.some(s => s.cycle >= startCycle && s.cycle <= endCycle)
    ).slice(-20); // Show last 20 instructions

    const h = headerH + entries.length * rowH + 8;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // Draw cycle numbers header
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (let c = startCycle; c < endCycle; c++) {
      const x = labelW + (c - startCycle) * cellW + cellW / 2;
      ctx.fillText(c.toString(), x, 16);
    }

    // Header separator
    ctx.strokeStyle = 'rgba(48,54,61,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, headerH);
    ctx.lineTo(w, headerH);
    ctx.stroke();

    // Draw entries
    entries.forEach((entry, rowIdx) => {
      const y = headerH + rowIdx * rowH;

      // Alternating row bg
      if (rowIdx % 2 === 0) {
        ctx.fillStyle = 'rgba(22,27,34,0.5)';
        ctx.fillRect(0, y, w, rowH);
      }

      // Instruction label
      ctx.fillStyle = '#c9d1d9';
      ctx.font = '10px ui-monospace, monospace';
      ctx.textAlign = 'left';
      const label = entry.instruction.length > 20
        ? entry.instruction.substring(0, 18) + '…'
        : entry.instruction;
      ctx.fillText(label, 8, y + rowH / 2 + 3.5);

      // Draw stage cells
      entry.stages.forEach(stage => {
        if (stage.cycle < startCycle || stage.cycle >= endCycle) return;
        const x = labelW + (stage.cycle - startCycle) * cellW;
        const color = STAGE_COLORS[stage.stage] || '#666';
        const bgColor = STAGE_BG[stage.stage] || 'rgba(102,102,102,0.2)';

        // Cell background
        ctx.fillStyle = stage.stalled ? 'rgba(239,68,68,0.15)' : bgColor;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 3, cellW - 4, rowH - 6, 3);
        ctx.fill();

        // Cell border
        ctx.strokeStyle = stage.stalled ? 'rgba(239,68,68,0.4)' : color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 3, cellW - 4, rowH - 6, 3);
        ctx.stroke();

        // Stage label
        ctx.fillStyle = color;
        ctx.font = 'bold 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(stage.stage, x + cellW / 2, y + rowH / 2 + 3);
      });
    });

    // Current cycle line
    if (cycle >= startCycle && cycle < endCycle) {
      const cx = labelW + (cycle - startCycle) * cellW + cellW / 2;
      ctx.strokeStyle = 'rgba(56,189,248,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, headerH);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Label column separator
    ctx.strokeStyle = 'rgba(48,54,61,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(labelW, 0);
    ctx.lineTo(labelW, h);
    ctx.stroke();

  }, [timingDiagram, cycle]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pipeline Timing Diagram
        </h3>
        <div className="flex items-center gap-2">
          {Object.entries(STAGE_COLORS).map(([stage, color]) => (
            <div key={stage} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-mono text-muted-foreground">{stage}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto custom-scrollbar">
        <canvas ref={canvasRef} />
        {timingDiagram.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs italic">
            Step through execution to build the timing diagram.
          </div>
        )}
      </div>
    </div>
  );
}
