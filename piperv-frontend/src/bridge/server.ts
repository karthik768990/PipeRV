import { SimulatorBridge } from './interface';
import { SimulatorState } from '../types/simulator';
import { SimulatorConfig } from '../types/config';

export class ServerBridge implements SimulatorBridge {
  private baseUrl = 'http://localhost:8080/api';

  async loadProgram(asmText: string, memoryJson: {addr: number, value: number}[], config: SimulatorConfig): Promise<void> {
    await fetch(`${this.baseUrl}/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asm: asmText, memory: memoryJson, config })
    });
  }

  async step(): Promise<SimulatorState> {
    const res = await fetch(`${this.baseUrl}/step`, { method: 'POST' });
    return res.json();
  }

  async run(): Promise<SimulatorState> {
    const res = await fetch(`${this.baseUrl}/run`, { method: 'POST' });
    return res.json();
  }

  async reset(): Promise<SimulatorState> {
    const res = await fetch(`${this.baseUrl}/reset`, { method: 'POST' });
    return res.json();
  }

  async getConfig(): Promise<SimulatorConfig> {
    const res = await fetch(`${this.baseUrl}/config`);
    return res.json();
  }

  async setConfig(config: SimulatorConfig): Promise<void> {
    await fetch(`${this.baseUrl}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  }

  async getState(): Promise<SimulatorState> {
    const res = await fetch(`${this.baseUrl}/state`);
    return res.json();
  }
}
