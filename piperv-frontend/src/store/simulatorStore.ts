import { create } from 'zustand';
import { SimulatorState, PipelineStageState } from '../types/simulator';
import { getBridge } from '../bridge';
import { useConfigStore } from './configStore';

interface SimulatorStore {
  state: SimulatorState | null;
  history: SimulatorState[];
  isRunning: boolean;
  isReady: boolean;
  
  loadProgram: (asm: string, memoryInit: {addr: number, value: number}[]) => Promise<void>;
  step: () => Promise<void>;
  run: () => Promise<void>;
  reset: () => Promise<void>;
  pause: () => void;
  setSpeed: (speedMs: number) => void;
  speedMs: number;
}

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  state: null,
  history: [],
  isRunning: false,
  isReady: false,
  speedMs: 50,

  loadProgram: async (asm, memoryInit) => {
    const config = useConfigStore.getState().config;
    await getBridge().loadProgram(asm, memoryInit, config);
    const initialState = await getBridge().getState();
    set({ state: initialState, history: [initialState], isReady: true });
  },

  step: async () => {
    if (!get().isReady) return;
    const newState = await getBridge().step();
    set((state) => ({
      state: newState,
      history: [...state.history, newState]
    }));
  },

  run: async () => {
    if (!get().isReady) return;
    set({ isRunning: true });
    
    const runLoop = async () => {
      if (!get().isRunning) return;
      const state = get().state;
      if (state && state.halted) {
        set({ isRunning: false });
        return;
      }
      
      await get().step();
      setTimeout(runLoop, get().speedMs);
    };
    
    runLoop();
  },

  pause: () => {
    set({ isRunning: false });
  },

  reset: async () => {
    if (!get().isReady) return;
    set({ isRunning: false });
    const state = await getBridge().reset();
    set({ state, history: [state] });
  },

  setSpeed: (speedMs) => set({ speedMs })
}));
