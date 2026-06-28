"use client";

import React, { useState, useCallback } from 'react';
import { useSimulatorStore, RegisterView } from '@/store/simulatorStore';

function formatHex(value: number): string {
  return '0x' + ((value >>> 0).toString(16)).padStart(8, '0').toUpperCase();
}

function formatBinaryGrouped(value: number): string {
  const bin = ((value >>> 0).toString(2)).padStart(32, '0');
  return bin.replace(/(.{4})/g, '$1 ').trim();
}

type DisplayFormat = 'decimal' | 'hex' | 'binary';

// ─── RegisterRow (defined BEFORE RegisterPanel so the const is in scope) ───
const RegisterRow = React.memo(function RegisterRow({
  reg,
  isEditing,
  isHovered,
  editValue,
  formatValue,
  setHoveredReg,
  handleStartEdit,
  setEditValue,
  handleConfirmEdit,
  setEditingReg,
}: {
  reg: RegisterView;
  isEditing: boolean;
  isHovered: boolean;
  editValue: string;
  formatValue: (v: number) => string;
  setHoveredReg: (i: number | null) => void;
  handleStartEdit: (r: RegisterView) => void;
  setEditValue: (v: string) => void;
  handleConfirmEdit: () => void;
  setEditingReg: (i: number | null) => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 px-2 py-[5px] rounded-md text-xs font-mono transition-all duration-200 cursor-pointer
        ${reg.changed
          ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
          : isHovered
            ? 'bg-muted/50'
            : 'hover:bg-muted/30'
        }
        ${reg.index === 0 ? 'opacity-50' : ''}
      `}
      onMouseEnter={() => setHoveredReg(reg.index)}
      onMouseLeave={() => setHoveredReg(null)}
      onDoubleClick={() => handleStartEdit(reg)}
    >
      {/* Register name */}
      <div className="w-8 shrink-0 text-right">
        <span className={`font-bold ${reg.changed ? 'text-emerald-400' : 'text-sky-400/80'}`}>
          x{reg.index}
        </span>
      </div>

      {/* ABI name */}
      <div className="w-10 shrink-0">
        <span className="text-muted-foreground text-[10px]">
          {reg.abiName}
        </span>
      </div>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            className="w-full bg-background border border-sky-500/50 rounded px-1 py-0.5 text-xs font-mono text-foreground outline-none focus:ring-1 focus:ring-sky-500"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleConfirmEdit();
              if (e.key === 'Escape') setEditingReg(null);
            }}
            onBlur={handleConfirmEdit}
          />
        ) : (
          <span className={`truncate block ${reg.changed ? 'text-emerald-300 font-semibold' : 'text-foreground/80'}`}>
            {formatValue(reg.value)}
          </span>
        )}
      </div>

      {/* Change indicator */}
      {reg.changed && (
        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      )}
    </div>
  );
}, (prev, next) => {
  return prev.reg === next.reg &&
         prev.isEditing === next.isEditing &&
         prev.isHovered === next.isHovered &&
         (prev.isEditing ? prev.editValue === next.editValue : true) &&
         prev.formatValue === next.formatValue;
});

// ─── RegisterPanel (main component) ───
export default function RegisterPanel() {
  const { registers, status, editRegister } = useSimulatorStore();
  const [format, setFormat] = useState<DisplayFormat>('hex');
  const [editingReg, setEditingReg] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredReg, setHoveredReg] = useState<number | null>(null);

  const canEdit = status === 'paused' || status === 'loaded';

  const handleStartEdit = useCallback((reg: RegisterView) => {
    if (!canEdit || reg.index === 0) return;
    setEditingReg(reg.index);
    setEditValue(reg.value.toString());
  }, [canEdit]);

  const handleConfirmEdit = useCallback(() => {
    if (editingReg === null) return;
    let val = 0;
    const s = editValue.trim();
    if (s.startsWith('0x') || s.startsWith('0X')) val = parseInt(s, 16);
    else if (s.startsWith('0b') || s.startsWith('0B')) val = parseInt(s.substring(2), 2);
    else val = parseInt(s, 10);
    if (!isNaN(val)) editRegister(editingReg, val);
    setEditingReg(null);
  }, [editingReg, editValue, editRegister]);

  const formatValue = useCallback((val: number): string => {
    switch (format) {
      case 'hex': return formatHex(val);
      case 'binary': return formatBinaryGrouped(val);
      default: return val.toString();
    }
  }, [format]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-card/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Registers
        </h3>
        <div className="flex items-center gap-1">
          {(['decimal', 'hex', 'binary'] as DisplayFormat[]).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all duration-150
                ${format === f
                  ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              {f === 'decimal' ? 'DEC' : f === 'hex' ? 'HEX' : 'BIN'}
            </button>
          ))}
        </div>
      </div>

      {/* Register list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="p-1">
          {registers.map(reg => (
            <RegisterRow
              key={reg.index}
              reg={reg}
              isEditing={editingReg === reg.index}
              isHovered={hoveredReg === reg.index}
              editValue={editValue}
              formatValue={formatValue}
              setHoveredReg={setHoveredReg}
              handleStartEdit={handleStartEdit}
              setEditValue={setEditValue}
              handleConfirmEdit={handleConfirmEdit}
              setEditingReg={setEditingReg}
            />
          ))}
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredReg !== null && hoveredReg < registers.length && (
        <div className="px-3 py-2 border-t border-border/60 bg-card/90 text-[10px] font-mono space-y-0.5">
          <div className="text-muted-foreground">
            <span className="text-sky-400">x{hoveredReg}</span> ({registers[hoveredReg].abiName})
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <span className="text-muted-foreground">Dec:</span>
            <span className="text-foreground">{registers[hoveredReg].value}</span>
            <span className="text-muted-foreground">Hex:</span>
            <span className="text-foreground">{formatHex(registers[hoveredReg].value)}</span>
            <span className="text-muted-foreground">Unsigned:</span>
            <span className="text-foreground">{(registers[hoveredReg].value >>> 0).toString()}</span>
          </div>
          {registers[hoveredReg].changed && (
            <div className="text-emerald-400 mt-1">
              ← was {registers[hoveredReg].prevValue}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
