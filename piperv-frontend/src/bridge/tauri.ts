import { SimulatorBridge } from './interface';
import { SimulatorState } from '../types/simulator';
import { SimulatorConfig } from '../types/config';

export class TauriBridge implements SimulatorBridge {
  async loadProgram(asmText: string, memoryJson: {addr: number, value: number}[], config: SimulatorConfig): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('load_program', { asmText, memoryJson, config });
  }

  async step(): Promise<SimulatorState> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('step');
  }

  async run(): Promise<SimulatorState> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('run');
  }

  async reset(): Promise<SimulatorState> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('reset');
  }

  async getConfig(): Promise<SimulatorConfig> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('get_config');
  }

  async setConfig(config: SimulatorConfig): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('set_config', { config });
  }

  async getState(): Promise<SimulatorState> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke('get_state');
  }
}
