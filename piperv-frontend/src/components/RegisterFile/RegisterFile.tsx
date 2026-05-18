import React from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';
import { useUiStore } from '../../store/uiStore';
import { clsx } from 'clsx';

const ABI_NAMES = [
  'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2',
  's0/fp', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5',
  'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7',
  's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'
];

export const RegisterFile: React.FC = () => {
  const { state } = useSimulatorStore();
  const { registerNameFormat, setRegisterNameFormat, registerValueFormat, setRegisterValueFormat } = useUiStore();

  const registers = state?.registers || Array(32).fill(0);

  const formatValue = (val: number) => {
    if (registerValueFormat === 'Dec') return val.toString();
    if (registerValueFormat === 'Hex') return '0x' + (val >>> 0).toString(16).padStart(8, '0');
    return '0b' + (val >>> 0).toString(2).padStart(32, '0');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-2 border-b border-border bg-background/50 flex justify-between items-center">
        <span className="font-semibold text-sm">Registers</span>
        <div className="flex space-x-2 text-xs">
          <select 
            className="bg-surface border border-border rounded text-text-primary px-1"
            value={registerNameFormat}
            onChange={e => setRegisterNameFormat(e.target.value as any)}
          >
            <option value="x-names">x0-x31</option>
            <option value="abi">ABI</option>
          </select>
          <select 
            className="bg-surface border border-border rounded text-text-primary px-1"
            value={registerValueFormat}
            onChange={e => setRegisterValueFormat(e.target.value as any)}
          >
            <option value="Dec">Dec</option>
            <option value="Hex">Hex</option>
            <option value="Bin">Bin</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        <div className="grid grid-cols-2 gap-1 text-sm font-mono">
          {registers.map((val, i) => (
            <div key={i} className={clsx("flex justify-between p-1 rounded", i === 0 ? "text-text-secondary opacity-50" : "hover:bg-border/50")}>
              <span className="text-active w-8">{registerNameFormat === 'abi' ? ABI_NAMES[i] : `x${i}`}</span>
              <span className="truncate ml-2">{formatValue(val)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
