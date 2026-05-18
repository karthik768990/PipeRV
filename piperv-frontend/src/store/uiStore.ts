import { create } from 'zustand';

interface UiStore {
  theme: 'dark' | 'light' | 'high-contrast';
  setTheme: (theme: 'dark' | 'light' | 'high-contrast') => void;
  selectedStage: string | null;
  setSelectedStage: (stage: string | null) => void;
  registerNameFormat: 'x-names' | 'abi';
  setRegisterNameFormat: (format: 'x-names' | 'abi') => void;
  registerValueFormat: 'Dec' | 'Hex' | 'Bin';
  setRegisterValueFormat: (format: 'Dec' | 'Hex' | 'Bin') => void;
}

export const useUiStore = create<UiStore>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
  selectedStage: null,
  setSelectedStage: (selectedStage) => set({ selectedStage }),
  registerNameFormat: 'abi',
  setRegisterNameFormat: (registerNameFormat) => set({ registerNameFormat }),
  registerValueFormat: 'Hex',
  setRegisterValueFormat: (registerValueFormat) => set({ registerValueFormat })
}));
