"use client";

import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import {
  Play, Square, Pause, RotateCcw, StepForward, SkipForward,
  ChevronLeft, Bug, Zap, Gauge,
} from 'lucide-react';

export default function DebugToolbar() {
  const {
    status, cycle, pc, stats, halted, canStepBack, executionSpeed,
    loadProgram, stepCycle, stepInstruction, run, pause, reset, stepBack,
    setExecutionSpeed,
  } = useSimulatorStore();

  const isIdle = status === 'idle';
  const isRunning = status === 'running';
  const canStep = status === 'loaded' || status === 'paused';
  const canRun = status === 'loaded' || status === 'paused';

  return (
    <div className="h-12 border-b border-border/60 bg-card/90 backdrop-blur-sm flex items-center px-3 gap-1 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3 pr-3 border-r border-border/40">
        <Zap className="w-5 h-5 text-sky-400" />
        <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
          PipeRV
        </span>
      </div>

      {/* Load / Assemble */}
      <button
        onClick={loadProgram}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
          bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 ring-1 ring-sky-500/20 hover:ring-sky-500/40"
        title="Assemble & Load (Ctrl+Enter)"
      >
        <Bug className="w-3.5 h-3.5" />
        Assemble
      </button>

      <div className="w-px h-6 bg-border/40 mx-1" />

      {/* Step Back */}
      <button
        onClick={stepBack}
        disabled={!canStepBack}
        className="p-1.5 rounded-md transition-all duration-150 disabled:opacity-20
          text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Step Back"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Step Cycle */}
      <button
        onClick={stepCycle}
        disabled={!canStep || halted}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 disabled:opacity-20
          text-amber-400 hover:bg-amber-500/15 ring-1 ring-amber-500/20 hover:ring-amber-500/40"
        title="Step One Cycle (F10)"
      >
        <StepForward className="w-3.5 h-3.5" />
        Cycle
      </button>

      {/* Step Instruction */}
      <button
        onClick={stepInstruction}
        disabled={!canStep || halted}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 disabled:opacity-20
          text-orange-400 hover:bg-orange-500/15 ring-1 ring-orange-500/20 hover:ring-orange-500/40"
        title="Step One Instruction (F11)"
      >
        <SkipForward className="w-3.5 h-3.5" />
        Instr
      </button>

      <div className="w-px h-6 bg-border/40 mx-1" />

      {/* Run */}
      {!isRunning ? (
        <button
          onClick={run}
          disabled={!canRun || halted}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 disabled:opacity-20
            bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 ring-1 ring-emerald-500/20 hover:ring-emerald-500/40"
          title="Run (F5)"
        >
          <Play className="w-3.5 h-3.5" />
          Run
        </button>
      ) : (
        <button
          onClick={pause}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150
            bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/25 ring-1 ring-yellow-500/20 hover:ring-yellow-500/40"
          title="Pause (F5)"
        >
          <Pause className="w-3.5 h-3.5" />
          Pause
        </button>
      )}

      {/* Reset */}
      <button
        onClick={reset}
        disabled={isIdle}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-150 disabled:opacity-20
          text-red-400 hover:bg-red-500/15 ring-1 ring-red-500/20 hover:ring-red-500/40"
        title="Reset (Ctrl+Shift+R)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset
      </button>

      <div className="w-px h-6 bg-border/40 mx-1" />

      {/* Speed control */}
      <div className="flex items-center gap-2">
        <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="range"
          min="10"
          max="500"
          step="10"
          value={510 - executionSpeed}
          onChange={e => setExecutionSpeed(510 - parseInt(e.target.value))}
          className="w-20 h-1 accent-sky-500 cursor-pointer"
          title={`Speed: ${Math.round(1000 / executionSpeed)} steps/s`}
        />
        <span className="text-[10px] text-muted-foreground font-mono w-12">
          {executionSpeed <= 20 ? 'MAX' : `${Math.round(1000 / executionSpeed)}/s`}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status bar */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            status === 'running' ? 'bg-emerald-400 animate-pulse' :
            status === 'paused' ? 'bg-yellow-400' :
            status === 'halted' ? 'bg-red-400' :
            status === 'loaded' ? 'bg-sky-400' :
            status === 'error' ? 'bg-red-500' :
            'bg-muted-foreground/30'
          }`} />
          <span className="uppercase font-bold">{status}</span>
        </div>
        <span>Cycle: <span className="text-foreground font-semibold">{cycle}</span></span>
        <span>PC: <span className="text-foreground font-semibold">0x{(pc * 4).toString(16).padStart(4, '0')}</span></span>
        <span>IPC: <span className="text-foreground font-semibold">{stats.instructionCount > 0 ? (stats.instructionCount / Math.max(1, stats.cycleCount)).toFixed(2) : '—'}</span></span>
        <span>Stalls: <span className="text-amber-400 font-semibold">{stats.stallCount}</span></span>
      </div>
    </div>
  );
}
