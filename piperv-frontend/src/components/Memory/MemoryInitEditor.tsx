import React, { useState } from 'react';
import { useSimulatorStore } from '../../store/simulatorStore';

export const MemoryInitEditor: React.FC = () => {
  const [address, setAddress] = useState<string>('0');
  const [value, setValue] = useState<string>('0');
  const [initList, setInitList] = useState<{addr: number, value: number}[]>([
    { addr: 0, value: 5 },
    { addr: 4, value: 1 },
    { addr: 8, value: 4 },
    { addr: 12, value: 2 },
    { addr: 16, value: 8 }
  ]); // Pre-loaded with Bubble Sort array

  const handleAdd = () => {
    const addrNum = parseInt(address, 10);
    const valNum = parseInt(value, 10);
    if (isNaN(addrNum) || isNaN(valNum) || addrNum % 4 !== 0 || addrNum < 0) {
      alert('Address must be a positive multiple of 4');
      return;
    }
    const newList = [...initList.filter(i => i.addr !== addrNum), { addr: addrNum, value: valNum }];
    setInitList(newList.sort((a, b) => a.addr - b.addr));
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded p-2">
      <div className="font-semibold text-sm mb-2 border-b border-border pb-1">Memory Init</div>
      <div className="flex gap-2 mb-2">
        <input 
          type="number" step="4" min="0" value={address} onChange={e => setAddress(e.target.value)} 
          className="w-1/2 bg-background border border-border rounded px-1 text-sm" placeholder="Addr" 
        />
        <input 
          type="number" value={value} onChange={e => setValue(e.target.value)} 
          className="w-1/2 bg-background border border-border rounded px-1 text-sm" placeholder="Value" 
        />
        <button onClick={handleAdd} className="bg-active text-background px-2 rounded text-xs font-bold">Add</button>
      </div>
      <div className="flex-1 overflow-auto text-sm font-mono">
        {initList.map(item => (
          <div key={item.addr} className="flex justify-between py-1 border-b border-border/30">
            <span className="text-active">0x{item.addr.toString(16).padStart(4, '0')}</span>
            <span>{item.value}</span>
            <button onClick={() => setInitList(initList.filter(i => i.addr !== item.addr))} className="text-hazard text-xs px-1">X</button>
          </div>
        ))}
      </div>
    </div>
  );
};
