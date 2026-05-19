import { create } from 'zustand';

interface IdeState {
    code: string;
    logs: string[];
    isRunning: boolean;
    cycle: number;
    tlbEntries: any[];
    pageTable: any[];
    setCode: (code: string) => void;
    appendLog: (log: string) => void;
    clearLogs: () => void;
    setIsRunning: (running: boolean) => void;
    setSimulationState: (data: Partial<IdeState>) => void;
}

export const useIdeStore = create<IdeState>((set) => ({
    code: `# Sample RISC-V Program\n# Loads from virtual addresses and performs math\n\nLW x5, 0x1000\nLW x6, 0x1004\nADD x7, x5, x6\nSW x7, 0x2000`,
    logs: [],
    isRunning: false,
    cycle: 0,
    tlbEntries: [],
    pageTable: [],
    setCode: (code) => set({ code }),
    appendLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
    clearLogs: () => set({ logs: [], cycle: 0 }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setSimulationState: (data) => set((state) => ({ ...state, ...data }))
}));
