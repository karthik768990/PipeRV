"use client";

import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';

// SVG-based animated datapath rendering
export default function DatapathVisualization() {
  const { pipelineStages, hazards, forwarding, cycle, stats } = useSimulatorStore();

  const ifStage = pipelineStages[0];
  const idStage = pipelineStages[1];
  const exStage = pipelineStages[2];
  const memStage = pipelineStages[3];
  const wbStage = pipelineStages[4];

  const activeColor = (active: boolean, stalled: boolean) => {
    if (stalled) return '#ef4444';
    return active ? '#38bdf8' : '#30363d';
  };

  const signalColor = (active: boolean) => active ? '#38bdf8' : '#1e293b';
  const fwdColor = '#22d3ee';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Datapath
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">Cycle {cycle}</span>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-2 flex items-center justify-center">
        <svg viewBox="0 0 900 420" className="w-full h-full max-h-[400px]" style={{ minWidth: 600 }}>
          <defs>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Arrow marker */}
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" opacity="0.8"/>
            </marker>
            <marker id="arrowhead-fwd" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={fwdColor} opacity="0.9"/>
            </marker>
          </defs>

          {/* Background grid */}
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.3"/>
          </pattern>
          <rect width="900" height="420" fill="url(#grid)" rx="8"/>

          {/* ═══════ PC ═══════ */}
          <rect x="20" y="160" width="60" height="50" rx="6" fill="#0f172a"
            stroke={activeColor(!ifStage.isNOP, ifStage.stalled)} strokeWidth="2"/>
          <text x="50" y="180" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">PC</text>
          <text x="50" y="196" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace">
            {ifStage.details?.pc || '—'}
          </text>

          {/* ═══════ Instruction Memory ═══════ */}
          <rect x="110" y="130" width="90" height="110" rx="6" fill="#0f172a"
            stroke={activeColor(!ifStage.isNOP, ifStage.stalled)} strokeWidth="2"/>
          <text x="155" y="155" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">Instr</text>
          <text x="155" y="170" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">Memory</text>
          <text x="155" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontFamily="monospace">
            {ifStage.isNOP ? '—' : ifStage.instruction.substring(0, 14)}
          </text>
          {ifStage.stalled && (
            <text x="155" y="225" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">STALL</text>
          )}

          {/* Bus: PC → Instr Mem */}
          <line x1="80" y1="185" x2="110" y2="185"
            stroke={signalColor(!ifStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ IF/ID Register ═══════ */}
          <rect x="215" y="120" width="16" height="130" rx="3" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8"/>
          <text x="223" y="190" textAnchor="middle" fill="#3b82f6" fontSize="7" transform="rotate(-90,223,190)" fontWeight="bold">IF/ID</text>

          {/* Bus: Instr Mem → IF/ID */}
          <line x1="200" y1="185" x2="215" y2="185"
            stroke={signalColor(!ifStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ Register File ═══════ */}
          <rect x="250" y="130" width="90" height="110" rx="6" fill="#0f172a"
            stroke={activeColor(!idStage.isNOP, idStage.stalled)} strokeWidth="2"/>
          <text x="295" y="155" textAnchor="middle" fill="#14b8a6" fontSize="10" fontWeight="bold">Register</text>
          <text x="295" y="170" textAnchor="middle" fill="#14b8a6" fontSize="10" fontWeight="bold">File</text>
          <text x="295" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontFamily="monospace">
            {idStage.isNOP ? '—' : idStage.instruction.substring(0, 14)}
          </text>
          {idStage.stalled && (
            <text x="295" y="225" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">STALL</text>
          )}

          {/* Bus: IF/ID → RegFile */}
          <line x1="231" y1="185" x2="250" y2="185"
            stroke={signalColor(!idStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ ID/EX Register ═══════ */}
          <rect x="355" y="120" width="16" height="130" rx="3" fill="#134e4a" stroke="#14b8a6" strokeWidth="1.5" opacity="0.8"/>
          <text x="363" y="190" textAnchor="middle" fill="#14b8a6" fontSize="7" transform="rotate(-90,363,190)" fontWeight="bold">ID/EX</text>

          {/* Bus: RegFile → ID/EX */}
          <line x1="340" y1="185" x2="355" y2="185"
            stroke={signalColor(!idStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ ALU ═══════ */}
          <polygon points="395,145 480,175 480,195 395,225" fill="#0f172a"
            stroke={activeColor(!exStage.isNOP, exStage.stalled)} strokeWidth="2"/>
          <text x="440" y="185" textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">ALU</text>
          <text x="440" y="200" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontFamily="monospace">
            {exStage.isNOP ? '' : (exStage.aluResult !== undefined ? `= ${exStage.aluResult}` : '')}
          </text>

          {/* Bus: ID/EX → ALU */}
          <line x1="371" y1="160" x2="395" y2="160"
            stroke={signalColor(!exStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>
          <line x1="371" y1="210" x2="395" y2="210"
            stroke={signalColor(!exStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ EX/MEM Register ═══════ */}
          <rect x="500" y="120" width="16" height="130" rx="3" fill="#3b1f63" stroke="#a855f7" strokeWidth="1.5" opacity="0.8"/>
          <text x="508" y="190" textAnchor="middle" fill="#a855f7" fontSize="7" transform="rotate(-90,508,190)" fontWeight="bold">EX/MEM</text>

          {/* Bus: ALU → EX/MEM */}
          <line x1="480" y1="185" x2="500" y2="185"
            stroke={signalColor(!exStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ Data Memory ═══════ */}
          <rect x="535" y="130" width="90" height="110" rx="6" fill="#0f172a"
            stroke={activeColor(!memStage.isNOP, memStage.stalled)} strokeWidth="2"/>
          <text x="580" y="155" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">Data</text>
          <text x="580" y="170" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">Memory</text>
          <text x="580" y="195" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontFamily="monospace">
            {memStage.isNOP ? '—' : memStage.instruction.substring(0, 14)}
          </text>
          {memStage.stalled && (
            <text x="580" y="225" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold">STALL</text>
          )}

          {/* Bus: EX/MEM → Data Mem */}
          <line x1="516" y1="185" x2="535" y2="185"
            stroke={signalColor(!memStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ MEM/WB Register ═══════ */}
          <rect x="645" y="120" width="16" height="130" rx="3" fill="#14532d" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"/>
          <text x="653" y="190" textAnchor="middle" fill="#22c55e" fontSize="7" transform="rotate(-90,653,190)" fontWeight="bold">MEM/WB</text>

          {/* Bus: Data Mem → MEM/WB */}
          <line x1="625" y1="185" x2="645" y2="185"
            stroke={signalColor(!memStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ WB Mux / Write Back ═══════ */}
          <rect x="680" y="155" width="70" height="60" rx="6" fill="#0f172a"
            stroke={activeColor(!wbStage.isNOP, false)} strokeWidth="2"/>
          <text x="715" y="178" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">WB</text>
          <text x="715" y="198" textAnchor="middle" fill="#e2e8f0" fontSize="7" fontFamily="monospace">
            {wbStage.isNOP ? '—' : wbStage.instruction.substring(0, 10)}
          </text>

          {/* Bus: MEM/WB → WB */}
          <line x1="661" y1="185" x2="680" y2="185"
            stroke={signalColor(!wbStage.isNOP)} strokeWidth="2" markerEnd="url(#arrowhead)"/>

          {/* ═══════ WB → RegFile write-back path ═══════ */}
          {!wbStage.isNOP && (
            <path d="M 750 185 L 770 185 L 770 80 L 295 80 L 295 130"
              fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"
              markerEnd="url(#arrowhead)"/>
          )}

          {/* ═══════ Forwarding paths ═══════ */}
          {forwarding.exmemToEx && (
            <path d="M 508 250 L 508 290 L 430 290 L 430 225"
              fill="none" stroke={fwdColor} strokeWidth="2" strokeDasharray="6,3"
              markerEnd="url(#arrowhead-fwd)" filter="url(#glow)"/>
          )}
          {forwarding.memwbToEx && (
            <path d="M 653 250 L 653 310 L 420 310 L 420 225"
              fill="none" stroke={fwdColor} strokeWidth="2" strokeDasharray="6,3"
              markerEnd="url(#arrowhead-fwd)" filter="url(#glow)"/>
          )}

          {/* Forwarding labels */}
          {forwarding.exmemToEx && (
            <text x="470" y="285" textAnchor="middle" fill={fwdColor} fontSize="8" fontWeight="bold">
              EX→EX FWD
            </text>
          )}
          {forwarding.memwbToEx && (
            <text x="540" y="325" textAnchor="middle" fill={fwdColor} fontSize="8" fontWeight="bold">
              MEM→EX FWD
            </text>
          )}

          {/* ═══════ Control Unit ═══════ */}
          <rect x="250" y="40" width="80" height="40" rx="6" fill="#0f172a"
            stroke="#64748b" strokeWidth="1.5"/>
          <text x="290" y="60" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Control</text>
          <text x="290" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Unit</text>

          {/* Control signals */}
          <line x1="290" y1="80" x2="290" y2="130"
            stroke="#64748b" strokeWidth="1" strokeDasharray="3,2" opacity="0.4"/>

          {/* ═══════ Hazard legend ═══════ */}
          <rect x="20" y="340" width="250" height="70" rx="6" fill="#0d1117" stroke="#30363d" strokeWidth="1"/>
          <text x="35" y="358" fill="#8b949e" fontSize="8" fontWeight="bold">LEGEND</text>

          <circle cx="35" cy="375" r="4" fill="#38bdf8"/>
          <text x="45" y="378" fill="#8b949e" fontSize="7">Active signal</text>

          <circle cx="135" cy="375" r="4" fill="#ef4444"/>
          <text x="145" y="378" fill="#8b949e" fontSize="7">Stall</text>

          <line x1="25" y1="395" x2="50" y2="395" stroke={fwdColor} strokeWidth="2" strokeDasharray="4,2"/>
          <text x="55" y="398" fill="#8b949e" fontSize="7">Forwarding path</text>

          {/* Stats overlay */}
          <rect x="640" y="340" width="240" height="70" rx="6" fill="#0d1117" stroke="#30363d" strokeWidth="1"/>
          <text x="655" y="358" fill="#8b949e" fontSize="8" fontWeight="bold">STATS</text>
          <text x="655" y="375" fill="#c9d1d9" fontSize="8" fontFamily="monospace">
            Cycles: {stats.cycleCount} | Instr: {stats.instructionCount}
          </text>
          <text x="655" y="390" fill="#c9d1d9" fontSize="8" fontFamily="monospace">
            IPC: {stats.cycleCount > 0 ? (stats.instructionCount / stats.cycleCount).toFixed(3) : '—'} | Stalls: {stats.stallCount}
          </text>
          <text x="655" y="405" fill="#c9d1d9" fontSize="8" fontFamily="monospace">
            Data Hz: {stats.dataHazards} | Ctrl Hz: {stats.controlHazards}
          </text>
        </svg>
      </div>
    </div>
  );
}
