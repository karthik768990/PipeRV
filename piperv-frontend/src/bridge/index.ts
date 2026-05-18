import { SimulatorBridge } from './interface';
import { ServerBridge } from './server';
import { TauriBridge } from './tauri';
import { WasmBridge } from './wasm';

let activeBridge: SimulatorBridge;

export function getBridge(): SimulatorBridge {
  if (activeBridge) return activeBridge;

  if (window.__TAURI__) {
    activeBridge = new TauriBridge();
    console.log("Using Tauri Bridge");
  } else if (typeof (window as any).Module !== 'undefined' && (window as any).Module.loadProgram) {
    activeBridge = new WasmBridge();
    console.log("Using WASM Bridge");
  } else {
    activeBridge = new ServerBridge();
    console.log("Using Server Bridge");
  }

  return activeBridge;
}
