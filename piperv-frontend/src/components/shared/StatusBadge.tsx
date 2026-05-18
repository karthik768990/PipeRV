import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const StatusBadge: React.FC<{ status: 'ACTIVE' | 'STALLED' | 'FLUSHED' | 'FORWARDING' | 'BUBBLE' | 'CLEAN' }> = ({ status }) => {
  const styles = {
    ACTIVE: 'border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]',
    STALLED: 'border-[#ff4757] text-[#ff4757] animate-pulse shadow-[0_0_10px_rgba(255,71,87,0.2)]',
    FLUSHED: 'border-[#ffa502] text-[#ffa502] shadow-[0_0_10px_rgba(255,165,2,0.2)]',
    FORWARDING: 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10',
    BUBBLE: 'border-[#444] text-[#444] border-dashed',
    CLEAN: 'border-[#2ed573] text-[#2ed573] shadow-[0_0_10px_rgba(46,213,115,0.2)]'
  };

  return (
    <div className={cn('px-2 py-1 text-xs font-bold border rounded', styles[status])}>
      {status}
    </div>
  );
};
