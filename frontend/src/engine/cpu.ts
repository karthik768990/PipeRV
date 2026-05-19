// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - CPU
// Top-level orchestrator: parses, loads, steps, provides full snapshots
// ═══════════════════════════════════════════════════════════════════════

import {
  OPCODE, Instruction, createNOP, formatInstruction,
  CPUSnapshot, StatsSnapshot, HazardInfo, ForwardingInfo,
  PipelineTimingEntry, SimulatorConfig, DEFAULT_CONFIG,
} from './types';
import { RegisterFile } from './registerFile';
import { Memory } from './memory';
import { Pipeline, PipelineStepResult } from './pipeline';
import { Parser, ParseResult } from './parser';
import { Cache } from './cache';


export interface ExecutionLog {
  cycle: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'instruction' | 'hazard' | 'forward' | 'stage';
}

export class CPU {
  instructions: Instruction[] = [];
  pc: { value: number } = { value: 0 };

  registerFile: RegisterFile;
  memory: Memory;
  pipeline: Pipeline;
  config: SimulatorConfig;
  l1Cache: Cache | null = null;
  l2Cache: Cache | null = null;

  // Execution state
  cycleCount: number = 0;
  instructionCount: number = 0;
  stallCount: number = 0;
  flushCount: number = 0;
  halted: boolean = false;

  // History for reverse stepping
  history: CPUSnapshot[] = [];
  maxHistorySize: number = 1000;

  // Execution logs
  logs: ExecutionLog[] = [];

  // Pipeline timing diagram
  timingDiagram: PipelineTimingEntry[] = [];
  private activeTimingEntries: Map<number, PipelineTimingEntry> = new Map();

  // Last step result
  lastStepResult: PipelineStepResult | null = null;

  // Changed registers this cycle
  changedRegisters: number[] = [];
  changedMemory: number[] = [];

  // Source lines for display
  sourceLines: string[] = [];
  parseErrors: ParseResult['errors'] = [];

  constructor(config?: Partial<SimulatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerFile = new RegisterFile();
    this.memory = new Memory(65536); // 64KB
    this.pipeline = new Pipeline();
    this.rebuildCaches();
  }

  rebuildCaches(): void {
    if (this.config.cacheEnabled) {
      this.l1Cache = new Cache(
        this.config.l1Size,
        this.config.l1BlockSize,
        this.config.l1Assoc,
        this.config.l1Latency
      );
      this.l2Cache = new Cache(
        this.config.l2Size,
        this.config.l2BlockSize,
        this.config.l2Assoc,
        this.config.l2Latency
      );
    } else {
      this.l1Cache = null;
      this.l2Cache = null;
    }
  }


  /** Parse and load an assembly program */
  loadProgram(asmText: string): ParseResult {
    const parser = new Parser();
    const result = parser.parse(asmText);

    this.instructions = result.instructions;
    this.sourceLines = result.sourceLines;
    this.parseErrors = result.errors;

    this.reset();

    this.addLog('info', `Loaded ${this.instructions.length} instructions`);
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        this.addLog(err.severity === 'error' ? 'error' : 'warning',
          `Line ${err.line}: ${err.message}`);
      }
    }

    return result;
  }

  /** Reset CPU to initial state */
  reset(): void {
    this.pc = { value: 0 };
    this.registerFile.reset();
    this.memory.reset();
    this.pipeline.reset();
    this.cycleCount = 0;
    this.instructionCount = 0;
    this.stallCount = 0;
    this.flushCount = 0;
    this.halted = false;
    this.history = [];
    this.logs = [];
    this.timingDiagram = [];
    this.activeTimingEntries = new Map();
    this.lastStepResult = null;
    this.changedRegisters = [];
    this.changedMemory = [];
    if (this.l1Cache) this.l1Cache.reset();
    if (this.l2Cache) this.l2Cache.reset();
  }

  /** Execute one clock cycle */
  step(): PipelineStepResult | null {
    if (this.halted) return null;
    if (this.pc.value >= this.instructions.length && !this.pipeline.hasPendingInstructions()) {
      this.halted = true;
      this.addLog('info', `Execution complete. ${this.cycleCount} cycles, ${this.instructionCount} instructions.`);
      return null;
    }

    // Save snapshot for reverse stepping
    if (this.history.length < this.maxHistorySize) {
      this.history.push(this.takeSnapshot());
    } else if (this.history.length > 0) {
      this.history.shift();
      this.history.push(this.takeSnapshot());
    }

    // Track register changes
    this.registerFile.savePrevious();

    // Execute pipeline step
    const result = this.pipeline.step(
      this.instructions,
      this.pc,
      this.registerFile,
      this.memory,
      this.config,
      this.l1Cache,
      this.l2Cache,
      this.cycleCount,
    );

    this.cycleCount++;
    this.lastStepResult = result;

    // Track changes
    this.changedRegisters = this.registerFile.getChangedRegisters();
    this.changedMemory = this.memory.getAndClearModified();

    // Count completed instructions
    if (result.completedInstruction && result.completedInstruction.opcode !== OPCODE.NOP) {
      this.instructionCount++;
    }

    // Update stall/flush counts
    this.stallCount = this.pipeline.stallCount;
    this.flushCount = this.pipeline.flushCount;

    // Update timing diagram
    this.updateTimingDiagram(result);

    // Log execution details
    this.logCycleDetails(result);

    // Check halted
    if (this.pc.value >= this.instructions.length && !this.pipeline.hasPendingInstructions()) {
      this.halted = true;
      this.addLog('info', `Execution complete. ${this.cycleCount} cycles, ${this.instructionCount} instructions.`);
    }

    return result;
  }

  /** Run until completion or breakpoint */
  run(breakpoints?: Set<number>, maxCycles: number = 100000): void {
    let cycles = 0;
    while (!this.halted && cycles < maxCycles) {
      // Check breakpoints before step
      if (breakpoints && breakpoints.size > 0 && cycles > 0) {
        const currentPC = this.pc.value;
        if (currentPC < this.instructions.length) {
          const line = this.instructions[currentPC].sourceLine;
          if (line !== undefined && breakpoints.has(line)) {
            this.addLog('info', `Breakpoint hit at line ${line}`);
            return;
          }
        }
      }

      this.step();
      cycles++;
    }

    if (cycles >= maxCycles) {
      this.addLog('warning', `Execution stopped: max cycle limit (${maxCycles}) reached`);
    }
  }

  /** Step backward by restoring previous snapshot */
  stepBack(): boolean {
    if (this.history.length === 0) return false;

    const snapshot = this.history.pop()!;
    this.restoreSnapshot(snapshot);
    return true;
  }

  /** Take a complete snapshot of CPU state */
  takeSnapshot(): CPUSnapshot {
    return {
      cycle: this.cycleCount,
      pc: this.pc.value,
      registers: this.registerFile.getAll(),
      memory: this.memory.getNonZeroEntries(),
      pipeline: {
        if_id: { instruction: { ...this.pipeline.if_id.instruction }, pc: this.pipeline.if_id.pc },
        id_ex: { instruction: { ...this.pipeline.id_ex.instruction }, pc: this.pipeline.id_ex.pc, operand1: this.pipeline.id_ex.operand1, operand2: this.pipeline.id_ex.operand2 },
        ex_mem: { instruction: { ...this.pipeline.ex_mem.instruction }, aluResult: this.pipeline.ex_mem.aluResult, operand2: this.pipeline.ex_mem.operand2 },
        mem_wb: { instruction: { ...this.pipeline.mem_wb.instruction }, writeData: this.pipeline.mem_wb.writeData },
      },
      stats: this.getStats(),
      hazards: this.lastStepResult?.hazards || {
        dataStall: false, memStall: false, exStall: false,
        memStallCyclesRemaining: 0, loadUseDetected: false,
        branchTaken: false, stallReason: '',
      },
      forwarding: this.lastStepResult?.forwarding || {
        exmemToEx: false, memwbToEx: false,
        forwardRs1Source: 'none', forwardRs2Source: 'none',
      },
      halted: this.halted,
    };
  }

  /** Restore CPU state from snapshot */
  private restoreSnapshot(snapshot: CPUSnapshot): void {
    this.cycleCount = snapshot.cycle;
    this.pc.value = snapshot.pc;

    // Restore registers
    this.registerFile.reset();
    for (let i = 0; i < snapshot.registers.length; i++) {
      if (i > 0) this.registerFile.setDirect(i, snapshot.registers[i]);
    }

    // Restore memory
    this.memory.reset();
    for (const [addr, val] of Array.from(snapshot.memory.entries())) {
      this.memory.setDirect(addr, val);
    }

    // Restore pipeline registers
    this.pipeline.if_id = { ...snapshot.pipeline.if_id };
    this.pipeline.id_ex = { ...snapshot.pipeline.id_ex };
    this.pipeline.ex_mem = { ...snapshot.pipeline.ex_mem };
    this.pipeline.mem_wb = { ...snapshot.pipeline.mem_wb };

    this.halted = snapshot.halted;
    this.changedRegisters = [];
    this.changedMemory = [];
  }

  /** Get current statistics */
  getStats(): StatsSnapshot {
    return {
      cycleCount: this.cycleCount,
      instructionCount: this.instructionCount,
      stallCount: this.stallCount,
      flushCount: this.flushCount,
      dataHazards: this.pipeline.dataHazardCount,
      controlHazards: this.pipeline.controlHazardCount,
      cacheHits: this.l1Cache ? this.l1Cache.hits + (this.l2Cache ? this.l2Cache.hits : 0) : 0,
      cacheMisses: this.l2Cache ? this.l2Cache.misses : 0,
    };
  }

  /** Calculate CPI */
  getCPI(): number {
    if (this.instructionCount === 0) return 0;
    return this.cycleCount / this.instructionCount;
  }

  /** Calculate IPC */
  getIPC(): number {
    if (this.cycleCount === 0) return 0;
    return this.instructionCount / this.cycleCount;
  }

  /** Edit a register value (debug mode) */
  editRegister(index: number, value: number): void {
    this.registerFile.setDirect(index, value);
    this.addLog('info', `Register x${index} set to ${value} (0x${(value >>> 0).toString(16)})`);
  }

  /** Edit a memory value (debug mode) */
  editMemory(address: number, value: number): void {
    this.memory.setDirect(address, value);
    this.addLog('info', `Memory[0x${address.toString(16)}] set to ${value}`);
  }

  private addLog(type: ExecutionLog['type'], message: string): void {
    this.logs.push({ cycle: this.cycleCount, message, type });
    // Keep log size bounded
    if (this.logs.length > 5000) {
      this.logs = this.logs.slice(-4000);
    }
  }

  private logCycleDetails(result: PipelineStepResult): void {
    const ifInst = formatInstruction(this.pipeline.if_id.instruction);
    const idInst = formatInstruction(this.pipeline.id_ex.instruction);
    const exInst = formatInstruction(this.pipeline.ex_mem.instruction);
    const memInst = formatInstruction(this.pipeline.mem_wb.instruction);

    this.addLog('stage',
      `Cycle ${this.cycleCount}: IF[${ifInst}] ID[${idInst}] EX[${exInst}] MEM/WB[${memInst}]`);

    if (result.hazards.dataStall) {
      this.addLog('hazard', `Data hazard stall: ${result.hazards.stallReason}`);
    }
    if (result.hazards.branchTaken) {
      this.addLog('hazard', `Branch taken → PC = ${result.branchTarget}`);
    }
    if (result.forwarding.exmemToEx || result.forwarding.memwbToEx) {
      this.addLog('forward', `Forwarding active: rs1=${result.forwarding.forwardRs1Source} rs2=${result.forwarding.forwardRs2Source}`);
    }
    if (result.wbRegister >= 0) {
      this.addLog('instruction', `WB: x${result.wbRegister} ← ${result.wbValue} (0x${(result.wbValue >>> 0).toString(16)})`);
    }
  }

  private updateTimingDiagram(result: PipelineStepResult): void {
    const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    const pipelineInsts = [
      this.pipeline.if_id.instruction,
      this.pipeline.id_ex.instruction,
      this.pipeline.ex_mem.instruction,
      this.pipeline.mem_wb.instruction,
    ];

    // Track timing for the instruction entering IF
    const ifInst = this.pipeline.if_id.instruction;
    if (ifInst.opcode !== OPCODE.NOP && ifInst.sourceLine !== undefined) {
      const key = ifInst.sourceLine;
      if (!this.activeTimingEntries.has(key)) {
        const entry: PipelineTimingEntry = {
          instruction: formatInstruction(ifInst),
          sourceLine: ifInst.sourceLine,
          stages: [],
        };
        this.activeTimingEntries.set(key, entry);
        this.timingDiagram.push(entry);
      }
    }

    // Update all active entries
    for (const [key, entry] of Array.from(this.activeTimingEntries.entries())) {
      // Find which stage this instruction is currently in
      let found = false;
      for (let i = 0; i < pipelineInsts.length; i++) {
        if (pipelineInsts[i].sourceLine === key) {
          entry.stages.push({
            cycle: this.cycleCount,
            stage: stages[i],
            stalled: (result.hazards.dataStall && i <= 1) || result.hazards.memStall,
            flushed: false,
          });
          found = true;
          break;
        }
      }

      // Check WB (completed)
      if (result.completedInstruction?.sourceLine === key) {
        entry.stages.push({
          cycle: this.cycleCount,
          stage: 'WB',
          stalled: false,
          flushed: false,
        });
      }
    }

    // Keep diagram size bounded
    if (this.timingDiagram.length > 200) {
      this.timingDiagram = this.timingDiagram.slice(-150);
    }
  }
}
