"use client";

import React, { useState } from 'react';
import { useSimulatorStore, MemoryEntry } from '@/store/simulatorStore';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

type MemFormat = 'hex' | 'decimal' | 'binary';

export default function MemoryPanel() {
  const { memoryEntries, memoryBaseAddress, setMemoryBaseAddress, status, editMemory } = useSimulatorStore();
  const [format, setFormat] = useState<MemFormat>('hex');
  const [searchAddr, setSearchAddr] = useState('');
  const [editingAddr, setEditingAddr] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const canEdit = status === 'paused' || status === 'loaded';

  const formatValue = (val: number): string => {
    switch (format) {
      case 'hex': return '0x' + ((val >>> 0).toString(16)).padStart(8, '0').toUpperCase();
      case 'binary': return ((val >>> 0).toString(2)).padStart(32, '0');
      default: return val.toString();
    }
  };

  const handleSearch = () => {
    const s = searchAddr.trim();
    let addr = 0;
    if (s.startsWith('0x') || s.startsWith('0X')) addr = parseInt(s, 16);
    else addr = parseInt(s, 10);
    if (!isNaN(addr)) {
      addr = Math.max(0, addr - (addr % 4));
      setMemoryBaseAddress(addr);
    }
  };

  const navigatePage = (direction: 'up' | 'down') => {
    const step = 64 * 4; // 64 words
    const newBase = direction === 'up'
      ? Math.max(0, memoryBaseAddress - step)
      : memoryBaseAddress + step;
    setMemoryBaseAddress(newBase);
  };

  const handleStartEdit = (addr: number) => {
    if (!canEdit) return;
    setEditingAddr(addr);
    const entry = memoryEntries.find(e => e.address === addr);
    setEditValue(entry ? entry.value.toString() : '0');
  };

  const handleConfirmEdit = () => {
    if (editingAddr === null) return;
    let val = 0;
    const s = editValue.trim();
    if (s.startsWith('0x')) val = parseInt(s, 16);
    else val = parseInt(s, 10);
    if (!isNaN(val)) editMemory(editingAddr, val);
    setEditingAddr(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/60 bg-card/80 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Memory</h3>
          <div className="flex items-center gap-1">
            {(['hex', 'decimal', 'binary'] as MemFormat[]).map(f => (
              <button key={f} onClick={() => setFormat(f)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-150
                  ${format === f ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {f === 'decimal' ? 'DEC' : f === 'hex' ? 'HEX' : 'BIN'}
              </button>
            ))}
          </div>
        </div>

        {/* Address search */}
        <div className="flex items-center gap-1">
          <div className="flex-1 flex items-center bg-background border border-border rounded px-2">
            <Search className="w-3 h-3 text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent text-xs font-mono py-1 px-1.5 outline-none text-foreground placeholder:text-muted-foreground/50"
              placeholder="Go to address (0x...)"
              value={searchAddr}
              onChange={e => setSearchAddr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={() => navigatePage('up')} className="p-1 hover:bg-muted rounded transition-colors">
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => navigatePage('down')} className="p-1 hover:bg-muted rounded transition-colors">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Memory table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Table header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 grid grid-cols-[100px_1fr] px-3 py-1 border-b border-border/40">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Address</span>
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Value</span>
        </div>

        <div className="p-1">
          {memoryEntries.map(entry => {
            const isEditing = editingAddr === entry.address;
            return (
              <div
                key={entry.address}
                className={`grid grid-cols-[100px_1fr] px-2 py-[3px] rounded text-xs font-mono transition-all duration-200 cursor-pointer
                  ${entry.modified
                    ? 'bg-amber-500/10 ring-1 ring-amber-500/20'
                    : 'hover:bg-muted/30'
                  }
                  ${entry.value !== 0 ? '' : 'opacity-40'}
                `}
                onDoubleClick={() => handleStartEdit(entry.address)}
              >
                <span className={`${entry.modified ? 'text-amber-400' : 'text-violet-400/80'}`}>
                  0x{entry.address.toString(16).padStart(8, '0')}
                </span>

                {isEditing ? (
                  <input
                    autoFocus
                    className="bg-background border border-violet-500/50 rounded px-1 text-xs font-mono outline-none"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleConfirmEdit();
                      if (e.key === 'Escape') setEditingAddr(null);
                    }}
                    onBlur={handleConfirmEdit}
                  />
                ) : (
                  <span className={entry.modified ? 'text-amber-300' : 'text-foreground/80'}>
                    {formatValue(entry.value)}
                    {entry.modified && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </span>
                )}
              </div>
            );
          })}

          {memoryEntries.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-8 italic">
              No memory loaded. Load a program to view memory.
            </div>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="px-3 py-1.5 border-t border-border/60 bg-card/90 text-[10px] text-muted-foreground font-mono flex justify-between">
        <span>Base: 0x{memoryBaseAddress.toString(16).padStart(8, '0')}</span>
        <span>{memoryEntries.filter(e => e.value !== 0).length} non-zero words</span>
      </div>
    </div>
  );
}
