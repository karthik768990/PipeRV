import { SimulatorBridge } from './interface';
import { SimulatorState } from '../types/simulator';
import { SimulatorConfig } from '../types/config';

// Assume global Module is loaded from emscripten
declare const Module: any;

export class WasmBridge implements SimulatorBridge {
  async loadProgram(asmText: string, memoryJson: {addr: number, value: number}[], config: SimulatorConfig): Promise<void> {
    Module.initMemory(memoryJson);
    Module.setConfig(config);
    Module.loadProgram(asmText);
  }

  async step(): Promise<SimulatorState> {
    Module.step();
    return Module.getState();
  }

  async run(): Promise<SimulatorState> {
    Module.run();
    return Module.getState();
  }

  async reset(): Promise<SimulatorState> {
    Module.reset();
    return Module.getState();
  }

  async getConfig(): Promise<SimulatorConfig> {
    // In a real WASM bridge we would fetch it from C++
    return {} as SimulatorConfig;
  }

  async setConfig(config: SimulatorConfig): Promise<void> {
    Module.setConfig(config);
  }

  async getState(): Promise<SimulatorState> {
    return Module.getState();
  }
}
