"use client";

import React, { useRef, useEffect } from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Terminal, AlertCircle, Info, Zap, ArrowRight, Trash2 } from 'lucide-react';

export default function ConsolePanel() {
  const { logs, activeBottomPanel, setActiveBottomPanel, cycle } = useSimulatorStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  const filteredLogs = activeBottomPanel === 'trace'
    ? logs.filter(l => l.type === 'stage')
    : activeBottomPanel === 'logs'
      ? logs.filter(l => l.type !== 'stage')
      : logs;

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-400 shrink-0" />;
      case 'hazard': return <Zap className="w-3 h-3 text-red-400 shrink-0" />;
      case 'forward': return <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'instruction': return <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />;
      default: return <Info className="w-3 h-3 text-sky-400/60 shrink-0" />;
    }
  };

  const getLogColor = (type: string): string => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'hazard': return 'text-red-300';
      case 'forward': return 'text-cyan-300';
      case 'instruction': return 'text-emerald-300';
      case 'stage': return 'text-muted-foreground';
      default: return 'text-foreground/80';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Tab bar */}
      <div className="h-8 bg-[#161b22] border-b border-border/30 flex items-center px-2 shrink-0 gap-0.5">
        <Terminal className="w-3.5 h-3.5 text-muted-foreground mr-2" />
        {(['console', 'logs', 'trace'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveBottomPanel(tab)}
            className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded transition-all duration-150
              ${activeBottomPanel === tab
                ? 'bg-sky-500/15 text-sky-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
          >
            {tab}
          </button>
        ))}

        <div className="flex-1" />

        <span className="text-[10px] font-mono text-muted-foreground/50 mr-2">
          {filteredLogs.length} entries
        </span>
      </div>

      {/* Log output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 font-mono text-[11px] leading-relaxed">
        {filteredLogs.length === 0 ? (
          <div className="text-muted-foreground/40 text-center py-8 italic text-xs">
            {activeBottomPanel === 'trace'
              ? 'Step through execution to see cycle-by-cycle trace.'
              : 'Assemble and run a program to see output.'}
          </div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 py-[1px] hover:bg-white/[0.02] rounded px-1">
              {getLogIcon(log.type)}
              <span className="text-muted-foreground/40 shrink-0 w-10 text-right tabular-nums">
                {log.cycle}
              </span>
              <span className={getLogColor(log.type)}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
