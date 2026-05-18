import { SimulatorState } from '../types/simulator';
import { SimulatorConfig } from '../types/config';

export interface SimulatorBridge {
  loadProgram(asmText: string, memoryJson: {addr: number, value: number}[], config: SimulatorConfig): Promise<void>;
  step(): Promise<SimulatorState>;
  run(): Promise<SimulatorState>;
  reset(): Promise<SimulatorState>;
  getConfig(): Promise<SimulatorConfig>;
  setConfig(config: SimulatorConfig): Promise<void>;
  getState(): Promise<SimulatorState>;
}
