"use client";

import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { BarChart3, TrendingUp, Activity, AlertTriangle, Zap } from 'lucide-react';

function StatCard({ label, value, subValue, icon: Icon, color }: {
  label: string; value: string | number; subValue?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className={`rounded-lg border border-border/40 bg-gradient-to-br from-card/80 to-card/40 p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-extrabold tracking-tight text-foreground">{value}</div>
      {subValue && <div className="text-[10px] text-muted-foreground mt-0.5">{subValue}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PerformancePanel() {
  const { stats, cycle, config } = useSimulatorStore();

  const ipc = stats.cycleCount > 0 ? (stats.instructionCount / stats.cycleCount) : 0;
  const cpi = stats.instructionCount > 0 ? (stats.cycleCount / stats.instructionCount) : 0;
  const stallRate = stats.cycleCount > 0 ? (stats.stallCount / stats.cycleCount) * 100 : 0;
  const efficiency = stats.cycleCount > 0 ? ((stats.instructionCount / stats.cycleCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Performance</h3>
        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Cycles" value={stats.cycleCount} icon={Activity} color="text-sky-400" />
          <StatCard label="Instructions" value={stats.instructionCount} icon={TrendingUp} color="text-emerald-400" />
          <StatCard label="IPC" value={ipc.toFixed(3)} subValue="Instructions/Cycle" icon={Zap} color="text-violet-400" />
          <StatCard label="CPI" value={cpi.toFixed(3)} subValue="Cycles/Instruction" icon={Zap} color="text-orange-400" />
        </div>

        {/* Performance bars */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pipeline Efficiency</h4>
          <ProgressBar label="Pipeline Utilization" value={efficiency} max={100} color="bg-emerald-500" />
          <ProgressBar label="Stall Rate" value={stallRate} max={100} color="bg-red-500" />
        </div>

        {/* Hazard breakdown */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Hazard Analysis
          </h4>
          <div className="space-y-1.5">
            {[
              { label: 'Total Stalls', value: stats.stallCount, color: 'text-red-400' },
              { label: 'Data Hazards', value: stats.dataHazards, color: 'text-orange-400' },
              { label: 'Control Hazards', value: stats.controlHazards, color: 'text-yellow-400' },
              { label: 'Pipeline Flushes', value: stats.flushCount, color: 'text-purple-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-mono font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cache Performance */}
        {config.cacheEnabled && (
          <div className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              Cache Analysis
            </h4>
            <div className="space-y-1.5">
              {[
                { label: 'Cache Hits', value: stats.cacheHits, color: 'text-emerald-400' },
                { label: 'Cache Misses', value: stats.cacheMisses, color: 'text-red-400' },
                {
                  label: 'Hit Rate',
                  value: (stats.cacheHits + stats.cacheMisses) > 0
                    ? `${((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)}%`
                    : '—',
                  color: 'text-cyan-400'
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={`font-mono font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {stats.cycleCount > 0 && (
          <div className="rounded-lg border border-border/40 bg-gradient-to-br from-sky-500/5 to-violet-500/5 p-3">
            <div className="text-xs text-foreground/80">
              <span className="font-semibold">{stats.instructionCount}</span> instructions completed in{' '}
              <span className="font-semibold">{stats.cycleCount}</span> cycles with{' '}
              <span className="font-semibold text-red-400">{stats.stallCount}</span> stalls.
              {efficiency >= 80 && <span className="text-emerald-400 ml-1">Excellent pipeline efficiency!</span>}
              {efficiency >= 50 && efficiency < 80 && <span className="text-yellow-400 ml-1">Good pipeline usage.</span>}
              {efficiency < 50 && efficiency > 0 && <span className="text-red-400 ml-1">High stall rate detected.</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
