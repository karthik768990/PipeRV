// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulator Store - Comprehensive Zustand State Management
// ═══════════════════════════════════════════════════════════════════════

import { create } from 'zustand';
import {
  CPU, ExecutionLog,
  OPCODE, Instruction, createNOP, formatInstruction,
  CPUSnapshot, StatsSnapshot, HazardInfo, ForwardingInfo,
  PipelineTimingEntry, SimulatorConfig, DEFAULT_CONFIG,
  Breakpoint, REG_ABI_NAMES, OPCODE_NAMES,
  ParseResult, ParseError,
} from '@/engine';

export type SimulatorStatus = 'idle' | 'loaded' | 'running' | 'paused' | 'halted' | 'error';
export type Theme = 'dark' | 'light';
export type ActivePanel = 'registers' | 'memory' | 'pipeline' | 'datapath' | 'timing' | 'performance' | 'config';

export interface RegisterView {
  index: number;
  name: string;
  abiName: string;
  value: number;
  changed: boolean;
  prevValue: number;
}

export interface MemoryEntry {
  address: number;
  value: number;
  modified: boolean;
}

export interface PipelineStageView {
  name: string;
  instruction: string;
  opcode: string;
  isNOP: boolean;
  stalled: boolean;
  flushed: boolean;
  forwarded: boolean;
  aluResult?: number;
  details: Record<string, string | number | boolean | null>;
}

interface SimulatorState {
  // Core engine
  cpu: CPU | null;

  // Code
  code: string;
  sourceLines: string[];
  parseErrors: ParseError[];

  // Status
  status: SimulatorStatus;
  errorMessage: string;

  // Config
  config: SimulatorConfig;
  theme: Theme;

  // UI state
  activeRightPanel: ActivePanel;
  activeBottomPanel: 'console' | 'logs' | 'trace';
  showSidebar: boolean;
  showBottomPanel: boolean;

  // Execution state
  cycle: number;
  pc: number;
  registers: RegisterView[];
  memoryEntries: MemoryEntry[];
  memoryBaseAddress: number;
  memoryDisplayCount: number;
  pipelineStages: PipelineStageView[];
  stats: StatsSnapshot;
  hazards: HazardInfo;
  forwarding: ForwardingInfo;
  logs: ExecutionLog[];
  timingDiagram: PipelineTimingEntry[];
  halted: boolean;

  // Breakpoints
  breakpoints: Map<number, Breakpoint>;

  // History
  canStepBack: boolean;
  historyLength: number;

  // Execution speed
  executionSpeed: number; // ms between steps when running

  // Actions
  setCode: (code: string) => void;
  setTheme: (theme: Theme) => void;
  setConfig: (config: Partial<SimulatorConfig>) => void;
  setActiveRightPanel: (panel: ActivePanel) => void;
  setActiveBottomPanel: (panel: 'console' | 'logs' | 'trace') => void;
  toggleSidebar: () => void;
  toggleBottomPanel: () => void;
  setMemoryBaseAddress: (addr: number) => void;
  setExecutionSpeed: (speed: number) => void;

  // Simulator actions
  loadProgram: () => void;
  stepCycle: () => void;
  stepInstruction: () => void;
  run: () => void;
  pause: () => void;
  reset: () => void;
  stepBack: () => void;

  // Breakpoint actions
  toggleBreakpoint: (line: number) => void;
  clearAllBreakpoints: () => void;

  // Debug edit actions
  editRegister: (index: number, value: number) => void;
  editMemory: (address: number, value: number) => void;

  // Internal
  _runIntervalId: ReturnType<typeof setInterval> | null;
  _syncState: () => void;
}

function createEmptyRegisters(): RegisterView[] {
  return Array.from({ length: 32 }, (_, i) => ({
    index: i,
    name: `x${i}`,
    abiName: REG_ABI_NAMES[i],
    value: 0,
    changed: false,
    prevValue: 0,
  }));
}

function createEmptyPipelineStages(): PipelineStageView[] {
  return ['IF', 'ID', 'EX', 'MEM', 'WB'].map(name => ({
    name,
    instruction: 'NOP',
    opcode: 'NOP',
    isNOP: true,
    stalled: false,
    flushed: false,
    forwarded: false,
    details: {},
  }));
}

const emptyStats: StatsSnapshot = {
  cycleCount: 0, instructionCount: 0, stallCount: 0, flushCount: 0,
  dataHazards: 0, controlHazards: 0, cacheHits: 0, cacheMisses: 0,
};

const emptyHazards: HazardInfo = {
  dataStall: false, memStall: false, exStall: false,
  memStallCyclesRemaining: 0, loadUseDetected: false,
  branchTaken: false, stallReason: '',
};

const emptyForwarding: ForwardingInfo = {
  exmemToEx: false, memwbToEx: false,
  forwardRs1Source: 'none', forwardRs2Source: 'none',
};

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  // Initial state
  cpu: null,
  code: `# ═══════════════════════════════════════════
# PipeRV - RISC-V Pipeline Simulator
# Sample: Bubble Sort for 5 elements
# ═══════════════════════════════════════════

# Initialize array at base address 0
addi x1, x0, 5
sw x1, 0(x0)
addi x1, x0, 1
sw x1, 4(x0)
addi x1, x0, 4
sw x1, 8(x0)
addi x1, x0, 2
sw x1, 12(x0)
addi x1, x0, 8
sw x1, 16(x0)

# n = 5, i = 0
addi x10, x0, 5
addi x11, x0, 0

# Outer loop
outer_loop:
addi x12, x10, -1
sub x13, x11, x12
bne x13, x0, inner_init
jal x0, end

inner_init:
addi x14, x0, 0

inner_loop:
sub x15, x10, x11
addi x15, x15, -1
sub x16, x14, x15
bne x16, x0, compare
jal x0, outer_inc

compare:
add x17, x14, x14
add x17, x17, x17
lw x18, 0(x17)
addi x19, x17, 4
lw x20, 0(x19)
blt x20, x18, do_swap
jal x0, skip_swap

do_swap:
sw x20, 0(x17)
sw x18, 0(x19)

skip_swap:
addi x14, x14, 1
jal x0, inner_loop

outer_inc:
addi x11, x11, 1
jal x0, outer_loop

end:
nop
nop`,
  sourceLines: [],
  parseErrors: [],

  status: 'idle',
  errorMessage: '',
  config: { ...DEFAULT_CONFIG },
  theme: 'dark',

  activeRightPanel: 'registers',
  activeBottomPanel: 'console',
  showSidebar: true,
  showBottomPanel: true,

  cycle: 0,
  pc: 0,
  registers: createEmptyRegisters(),
  memoryEntries: [],
  memoryBaseAddress: 0,
  memoryDisplayCount: 64,
  pipelineStages: createEmptyPipelineStages(),
  stats: { ...emptyStats },
  hazards: { ...emptyHazards },
  forwarding: { ...emptyForwarding },
  logs: [],
  timingDiagram: [],
  halted: false,

  breakpoints: new Map(),
  canStepBack: false,
  historyLength: 0,
  executionSpeed: 100,
  _runIntervalId: null,

  // ═══════════ Setters ═══════════
  setCode: (code) => set({ code }),
  setTheme: (theme) => set({ theme }),
  setConfig: (partial) => {
    set(s => {
      const nextConfig = { ...s.config, ...partial };
      if (s.cpu) {
        s.cpu.config = nextConfig;
        s.cpu.rebuildCaches();
      }
      return { config: nextConfig };
    });
  },

  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),
  setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel }),
  toggleSidebar: () => set(s => ({ showSidebar: !s.showSidebar })),
  toggleBottomPanel: () => set(s => ({ showBottomPanel: !s.showBottomPanel })),
  setMemoryBaseAddress: (addr) => {
    set({ memoryBaseAddress: addr });
    get()._syncState();
  },
  setExecutionSpeed: (speed) => set({ executionSpeed: speed }),

  // ═══════════ Simulator Actions ═══════════
  loadProgram: () => {
    const { code, config } = get();
    try {
      const cpu = new CPU(config);
      const result = cpu.loadProgram(code);

      set({
        cpu,
        sourceLines: result.sourceLines,
        parseErrors: result.errors,
        status: result.errors.some(e => e.severity === 'error') ? 'error' : 'loaded',
        errorMessage: result.errors.filter(e => e.severity === 'error').map(e => `Line ${e.line}: ${e.message}`).join('\n'),
        halted: false,
      });
      get()._syncState();
    } catch (e) {
      set({
        status: 'error',
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  },

  stepCycle: () => {
    const { cpu, status } = get();
    if (!cpu || (status !== 'loaded' && status !== 'paused')) return;

    const result = cpu.step();
    if (result) {
      set({ status: cpu.halted ? 'halted' : 'paused' });
    } else {
      set({ status: 'halted' });
    }
    get()._syncState();
  },

  stepInstruction: () => {
    const { cpu, status } = get();
    if (!cpu || (status !== 'loaded' && status !== 'paused')) return;

    // Step until an instruction completes
    const startCount = cpu.instructionCount;
    let safety = 0;
    while (!cpu.halted && cpu.instructionCount === startCount && safety < 1000) {
      cpu.step();
      safety++;
    }

    set({ status: cpu.halted ? 'halted' : 'paused' });
    get()._syncState();
  },

  run: () => {
    const { cpu, status, executionSpeed } = get();
    if (!cpu || (status !== 'loaded' && status !== 'paused')) return;

    // Clear any existing interval
    const prevId = get()._runIntervalId;
    if (prevId) clearInterval(prevId);

    set({ status: 'running' });

    const intervalId = setInterval(() => {
      const { cpu: currentCpu, breakpoints, status: currentStatus } = get();
      if (!currentCpu || currentStatus !== 'running') {
        clearInterval(intervalId);
        set({ _runIntervalId: null });
        return;
      }

      // Run a batch of steps per interval for performance
      const batchSize = executionSpeed <= 10 ? 1 : executionSpeed <= 50 ? 5 : 10;

      for (let i = 0; i < batchSize; i++) {
        // Check breakpoints
        if (breakpoints.size > 0 && currentCpu.cycleCount > 0) {
          const currentPC = currentCpu.pc.value;
          if (currentPC < currentCpu.instructions.length) {
            const line = currentCpu.instructions[currentPC].sourceLine;
            if (line !== undefined && breakpoints.has(line) && breakpoints.get(line)!.enabled) {
              set({ status: 'paused', _runIntervalId: null });
              clearInterval(intervalId);
              get()._syncState();
              return;
            }
          }
        }

        const result = currentCpu.step();
        if (!result || currentCpu.halted) {
          set({ status: 'halted', _runIntervalId: null });
          clearInterval(intervalId);
          get()._syncState();
          return;
        }
      }

      get()._syncState();
    }, Math.max(16, executionSpeed));

    set({ _runIntervalId: intervalId });
  },

  pause: () => {
    const { _runIntervalId } = get();
    if (_runIntervalId) clearInterval(_runIntervalId);
    set({ status: 'paused', _runIntervalId: null });
    get()._syncState();
  },

  reset: () => {
    const { _runIntervalId, cpu } = get();
    if (_runIntervalId) clearInterval(_runIntervalId);
    if (cpu) cpu.reset();
    set({
      status: cpu ? 'loaded' : 'idle',
      _runIntervalId: null,
      cycle: 0,
      pc: 0,
      registers: createEmptyRegisters(),
      memoryEntries: [],
      pipelineStages: createEmptyPipelineStages(),
      stats: { ...emptyStats },
      hazards: { ...emptyHazards },
      forwarding: { ...emptyForwarding },
      logs: [],
      timingDiagram: [],
      halted: false,
      canStepBack: false,
      historyLength: 0,
    });
  },

  stepBack: () => {
    const { cpu } = get();
    if (!cpu) return;
    const success = cpu.stepBack();
    if (success) {
      set({ status: 'paused' });
      get()._syncState();
    }
  },

  // ═══════════ Breakpoints ═══════════
  toggleBreakpoint: (line) => {
    set(s => {
      const newBreakpoints = new Map(s.breakpoints);
      if (newBreakpoints.has(line)) {
        newBreakpoints.delete(line);
      } else {
        newBreakpoints.set(line, { line, enabled: true, hitCount: 0 });
      }
      return { breakpoints: newBreakpoints };
    });
  },

  clearAllBreakpoints: () => set({ breakpoints: new Map() }),

  // ═══════════ Debug Edit ═══════════
  editRegister: (index, value) => {
    const { cpu, status } = get();
    if (!cpu || (status !== 'paused' && status !== 'loaded')) return;
    cpu.editRegister(index, value);
    get()._syncState();
  },

  editMemory: (address, value) => {
    const { cpu, status } = get();
    if (!cpu || (status !== 'paused' && status !== 'loaded')) return;
    cpu.editMemory(address, value);
    get()._syncState();
  },

  // ═══════════ State Sync ═══════════
  _syncState: () => {
    const { cpu, memoryBaseAddress, memoryDisplayCount } = get();
    if (!cpu) return;

    // Sync registers
    const regs = cpu.registerFile.getAll();
    const changedRegs = new Set(cpu.changedRegisters);
    const registers: RegisterView[] = regs.map((val, i) => ({
      index: i,
      name: `x${i}`,
      abiName: REG_ABI_NAMES[i],
      value: val,
      changed: changedRegs.has(i),
      prevValue: changedRegs.has(i) ? (cpu.history.length > 0 ? cpu.history[cpu.history.length - 1].registers[i] : 0) : val,
    }));

    // Sync memory
    const memEntries = cpu.memory.getRange(memoryBaseAddress, memoryDisplayCount);
    const changedMem = new Set(cpu.changedMemory);
    const memoryEntries: MemoryEntry[] = memEntries.map(e => ({
      address: e.address,
      value: e.value,
      modified: changedMem.has(e.address),
    }));

    // Sync pipeline stages
    const p = cpu.pipeline;
    const hazards = cpu.lastStepResult?.hazards || emptyHazards;
    const forwarding = cpu.lastStepResult?.forwarding || emptyForwarding;

    const pipelineStages: PipelineStageView[] = [
      {
        name: 'IF',
        instruction: formatInstruction(p.if_id.instruction),
        opcode: OPCODE_NAMES[p.if_id.instruction.opcode] || 'NOP',
        isNOP: p.if_id.instruction.opcode === OPCODE.NOP,
        stalled: hazards.dataStall || hazards.exStall,
        flushed: false,
        forwarded: false,
        details: { pc: p.if_id.pc >= 0 ? `0x${(p.if_id.pc * 4).toString(16)}` : '-' },
      },
      {
        name: 'ID',
        instruction: formatInstruction(p.id_ex.instruction),
        opcode: OPCODE_NAMES[p.id_ex.instruction.opcode] || 'NOP',
        isNOP: p.id_ex.instruction.opcode === OPCODE.NOP,
        stalled: hazards.exStall || hazards.memStall,
        flushed: false,
        forwarded: false,
        details: {
          op1: p.id_ex.operand1,
          op2: p.id_ex.operand2,
          pc: p.id_ex.pc >= 0 ? `0x${(p.id_ex.pc * 4).toString(16)}` : '-',
        },
      },
      {
        name: 'EX',
        instruction: formatInstruction(p.ex_mem.instruction),
        opcode: OPCODE_NAMES[p.ex_mem.instruction.opcode] || 'NOP',
        isNOP: p.ex_mem.instruction.opcode === OPCODE.NOP,
        stalled: hazards.memStall,
        flushed: false,
        forwarded: forwarding.exmemToEx,
        aluResult: p.ex_mem.aluResult,
        details: { aluResult: p.ex_mem.aluResult },
      },
      {
        name: 'MEM',
        instruction: formatInstruction(p.mem_wb.instruction),
        opcode: OPCODE_NAMES[p.mem_wb.instruction.opcode] || 'NOP',
        isNOP: p.mem_wb.instruction.opcode === OPCODE.NOP,
        stalled: hazards.memStall,
        flushed: false,
        forwarded: forwarding.memwbToEx,
        details: { writeData: p.mem_wb.writeData },
      },
      {
        name: 'WB',
        instruction: cpu.lastStepResult?.completedInstruction
          ? formatInstruction(cpu.lastStepResult.completedInstruction)
          : 'NOP',
        opcode: cpu.lastStepResult?.completedInstruction
          ? OPCODE_NAMES[cpu.lastStepResult.completedInstruction.opcode] || 'NOP'
          : 'NOP',
        isNOP: !cpu.lastStepResult?.completedInstruction || cpu.lastStepResult.completedInstruction.opcode === OPCODE.NOP,
        stalled: false,
        flushed: false,
        forwarded: false,
        details: {
          rd: cpu.lastStepResult?.wbRegister ?? -1,
          value: cpu.lastStepResult?.wbValue ?? 0,
        },
      },
    ];

    set({
      cycle: cpu.cycleCount,
      pc: cpu.pc.value,
      registers,
      memoryEntries,
      pipelineStages,
      stats: cpu.getStats(),
      hazards,
      forwarding,
      logs: [...cpu.logs],
      timingDiagram: [...cpu.timingDiagram],
      halted: cpu.halted,
      canStepBack: cpu.history.length > 0,
      historyLength: cpu.history.length,
    });
  },
}));
