"use client";

import React from 'react';
import { useSimulatorStore } from '@/store/simulatorStore';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ConfigPanel() {
  const { config, setConfig, status } = useSimulatorStore();
  const canEdit = status === 'idle' || status === 'loaded';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Configuration</h3>
        <Settings className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        {/* Pipeline Settings */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pipeline</h4>

          {/* Forwarding toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/80">Data Forwarding</span>
            <button
              onClick={() => canEdit && setConfig({ forwardingEnabled: !config.forwardingEnabled })}
              className={`transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {config.forwardingEnabled
                ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              }
            </button>
          </div>

          {/* Instruction Latencies */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Instruction Latencies</span>
            {['ADD', 'SUB', 'MUL', 'LW', 'SW'].map(op => (
              <div key={op} className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-foreground/70">{op}</span>
                <select
                  value={config.latencies[op] || 1}
                  onChange={e => canEdit && setConfig({
                    latencies: { ...config.latencies, [op]: parseInt(e.target.value) }
                  })}
                  disabled={!canEdit}
                  className="bg-background border border-border rounded px-2 py-0.5 text-[11px] font-mono disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5].map(v => (
                    <option key={v} value={v}>{v} cycle{v > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Cache Settings */}
        <div className="rounded-lg border border-border/40 bg-card/50 p-3 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cache</h4>

          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/80">Enable Cache</span>
            <button
              onClick={() => canEdit && setConfig({ cacheEnabled: !config.cacheEnabled })}
              className={`transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {config.cacheEnabled
                ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                : <ToggleLeft className="w-6 h-6 text-muted-foreground" />
              }
            </button>
          </div>

          {config.cacheEnabled && (
            <div className="space-y-2">
              {[
                { label: 'L1 Size', key: 'l1Size' as const, options: [512, 1024, 2048, 4096] },
                { label: 'L1 Block Size', key: 'l1BlockSize' as const, options: [16, 32, 64, 128] },
                { label: 'L1 Associativity', key: 'l1Assoc' as const, options: [1, 2, 4, 8] },
                { label: 'L1 Latency', key: 'l1Latency' as const, options: [1, 2, 3, 5] },
                { label: 'Memory Latency', key: 'memLatency' as const, options: [10, 20, 50, 100] },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-[11px] text-foreground/70">{item.label}</span>
                  <select
                    value={config[item.key]}
                    onChange={e => canEdit && setConfig({ [item.key]: parseInt(e.target.value) })}
                    disabled={!canEdit}
                    className="bg-background border border-border rounded px-2 py-0.5 text-[11px] font-mono disabled:opacity-50"
                  >
                    {item.options.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {!canEdit && (
          <div className="text-[10px] text-amber-400/80 italic text-center">
            Reset the simulator to change configuration.
          </div>
        )}
      </div>
    </div>
  );
}
