import { create } from 'zustand';
import { SimulatorConfig } from '../types/config';

interface ConfigStore {
  config: SimulatorConfig;
  updateConfig: (updates: Partial<SimulatorConfig>) => void;
}

const defaultConfig: SimulatorConfig = {
  forwarding_enabled: false,
  IF_latency: 1,
  ID_latency: 1,
  EX_latency: 1,
  MEM_latency: 1,
  WB_latency: 1,
  cache_enabled: false,
  L1_cache_size: 1024,
  L1_block_size: 64,
  L1_miss_penalty: 3
};

export const useConfigStore = create<ConfigStore>((set) => ({
  config: defaultConfig,
  updateConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } }))
}));
