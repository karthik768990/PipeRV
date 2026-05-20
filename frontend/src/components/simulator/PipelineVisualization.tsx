"use client";

import React from 'react';
import { useSimulatorStore, PipelineStageView } from '@/store/simulatorStore';

const STAGE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  IF:  { bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  ID:  { bg: 'from-teal-500/20 to-teal-600/10', border: 'border-teal-500/40', text: 'text-teal-400', glow: 'shadow-teal-500/20' },
  EX:  { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  MEM: { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/40', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  WB:  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
};

const STAGE_LABELS: Record<string, string> = {
  IF: 'Instruction Fetch',
  ID: 'Instruction Decode',
  EX: 'Execute',
  MEM: 'Memory Access',
  WB: 'Write Back',
};

const PipelineStageCard = React.memo(function PipelineStageCard({ stage }: { stage: PipelineStageView }) {
  const colors = STAGE_COLORS[stage.name] || STAGE_COLORS.IF;

  return (
    <div className={`relative group rounded-lg border ${colors.border} bg-gradient-to-br ${colors.bg} p-3 transition-all duration-300 hover:shadow-lg ${colors.glow}
      ${stage.stalled ? 'ring-2 ring-red-500/30 animate-pulse' : ''}
      ${stage.flushed ? 'opacity-30' : ''}
    `}>
      {/* Stage name badge */}
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm font-extrabold tracking-tight ${colors.text}`}>
          {stage.name}
        </div>
        <div className="flex items-center gap-1.5">
          {stage.stalled && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-red-500/20 text-red-400 ring-1 ring-red-500/30">
              STALL
            </span>
          )}
          {stage.forwarded && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30">
              FWD
            </span>
          )}
          {stage.flushed && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30">
              FLUSH
            </span>
          )}
        </div>
      </div>

      {/* Instruction */}
      <div className={`font-mono text-xs font-semibold truncate ${stage.isNOP ? 'text-muted-foreground/50 italic' : 'text-foreground'}`}>
        {stage.isNOP ? '— bubble —' : stage.instruction}
      </div>

      {/* Stage description tooltip */}
      <div className="text-[10px] text-muted-foreground mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {STAGE_LABELS[stage.name]}
      </div>

      {/* Details on hover */}
      {!stage.isNOP && Object.keys(stage.details).length > 0 && (
        <div className="mt-2 space-y-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {Object.entries(stage.details).map(([key, val]) => (
            <div key={key} className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">{key}:</span>
              <span className="text-foreground/80">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.stage.name === next.stage.name &&
         prev.stage.instruction === next.stage.instruction &&
         prev.stage.stalled === next.stage.stalled &&
         prev.stage.flushed === next.stage.flushed &&
         prev.stage.forwarded === next.stage.forwarded &&
         JSON.stringify(prev.stage.details) === JSON.stringify(next.stage.details);
});

export default function PipelineVisualization() {
  const { pipelineStages, hazards, forwarding, cycle } = useSimulatorStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Pipeline Stages
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          Cycle {cycle}
        </span>
      </div>

      {/* Pipeline stages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {/* Visual pipeline flow */}
        <div className="flex flex-col gap-2">
          {pipelineStages.map((stage, i) => (
            <React.Fragment key={stage.name}>
              <PipelineStageCard stage={stage} />
              {i < pipelineStages.length - 1 && (
                <div className="flex justify-center">
                  <div className={`w-0.5 h-4 rounded-full transition-colors duration-300
                    ${stage.stalled ? 'bg-red-500/50' : 'bg-border/60'}`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Hazard info panel */}
        {(hazards.dataStall || hazards.memStall || hazards.branchTaken || forwarding.exmemToEx || forwarding.memwbToEx) && (
          <div className="mt-4 rounded-lg border border-border/60 bg-card/50 p-3 space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Active Events
            </h4>
            <div className="space-y-1">
              {hazards.dataStall && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 font-medium">Data Hazard</span>
                  <span className="text-muted-foreground text-[10px]">{hazards.stallReason}</span>
                </div>
              )}
              {hazards.memStall && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-400 font-medium">Memory Stall</span>
                  <span className="text-muted-foreground text-[10px]">{hazards.memStallCyclesRemaining} cycles remaining</span>
                </div>
              )}
              {hazards.branchTaken && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-yellow-400 font-medium">Branch Taken</span>
                </div>
              )}
              {(forwarding.exmemToEx || forwarding.memwbToEx) && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-cyan-400 font-medium">Forwarding Active</span>
                  <span className="text-muted-foreground text-[10px]">
                    RS1: {forwarding.forwardRs1Source} | RS2: {forwarding.forwardRs2Source}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
