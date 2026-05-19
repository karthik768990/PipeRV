// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - Type Definitions
// Mirrors the C++ core types for full browser-side simulation
// ═══════════════════════════════════════════════════════════════════════

export enum OPCODE {
  NOP = 0,
  ADD,
  SUB,
  ADDI,
  LW,
  SW,
  BNE,
  JAL,
  BLT,
  BGE,
  L,    // Trace-mode load
  S,    // Trace-mode store
  MUL,
  // ISA Expansion
  AND,
  OR,
  XOR,
  ANDI,
  ORI,
  XORI,
  SLL,
  SRL,
  SRA,
  SLLI,
  SRLI,
  SRAI,
  SLT,
  SLTU,
  SLTI,
  SLTIU,
  BEQ,
  BGEU,
  BLTU,
  LUI,
  AUIPC,
  JALR,
  LB,
  LH,
  LBU,
  LHU,
  SB,
  SH,
  COUNT,
}

export const OPCODE_NAMES: Record<OPCODE, string> = {
  [OPCODE.NOP]: 'NOP',
  [OPCODE.ADD]: 'ADD',
  [OPCODE.SUB]: 'SUB',
  [OPCODE.ADDI]: 'ADDI',
  [OPCODE.LW]: 'LW',
  [OPCODE.SW]: 'SW',
  [OPCODE.BNE]: 'BNE',
  [OPCODE.JAL]: 'JAL',
  [OPCODE.BLT]: 'BLT',
  [OPCODE.BGE]: 'BGE',
  [OPCODE.L]: 'L',
  [OPCODE.S]: 'S',
  [OPCODE.MUL]: 'MUL',
  [OPCODE.AND]: 'AND',
  [OPCODE.OR]: 'OR',
  [OPCODE.XOR]: 'XOR',
  [OPCODE.ANDI]: 'ANDI',
  [OPCODE.ORI]: 'ORI',
  [OPCODE.XORI]: 'XORI',
  [OPCODE.SLL]: 'SLL',
  [OPCODE.SRL]: 'SRL',
  [OPCODE.SRA]: 'SRA',
  [OPCODE.SLLI]: 'SLLI',
  [OPCODE.SRLI]: 'SRLI',
  [OPCODE.SRAI]: 'SRAI',
  [OPCODE.SLT]: 'SLT',
  [OPCODE.SLTU]: 'SLTU',
  [OPCODE.SLTI]: 'SLTI',
  [OPCODE.SLTIU]: 'SLTIU',
  [OPCODE.BEQ]: 'BEQ',
  [OPCODE.BGEU]: 'BGEU',
  [OPCODE.BLTU]: 'BLTU',
  [OPCODE.LUI]: 'LUI',
  [OPCODE.AUIPC]: 'AUIPC',
  [OPCODE.JALR]: 'JALR',
  [OPCODE.LB]: 'LB',
  [OPCODE.LH]: 'LH',
  [OPCODE.LBU]: 'LBU',
  [OPCODE.LHU]: 'LHU',
  [OPCODE.SB]: 'SB',
  [OPCODE.SH]: 'SH',
  [OPCODE.COUNT]: 'COUNT',
};

export interface Instruction {
  opcode: OPCODE;
  rd: number;    // -1 if unused
  rs1: number;   // -1 if unused
  rs2: number;   // -1 if unused
  immediate: number;
  sourceText?: string;  // Original assembly text for display
  sourceLine?: number;  // Line number in source
}

export function createNOP(): Instruction {
  return { opcode: OPCODE.NOP, rd: -1, rs1: -1, rs2: -1, immediate: 0 };
}

// Pipeline register interfaces
export interface IF_ID {
  instruction: Instruction;
  pc: number;
}

export interface ID_EX {
  instruction: Instruction;
  pc: number;
  operand1: number;
  operand2: number;
}

export interface EX_MEM {
  instruction: Instruction;
  aluResult: number;
  operand2: number;
}

export interface MEM_WB {
  instruction: Instruction;
  writeData: number;
}

// Snapshot of entire CPU state at a given cycle
export interface CPUSnapshot {
  cycle: number;
  pc: number;
  registers: number[];
  memory: Map<number, number>;  // Only non-zero entries
  pipeline: {
    if_id: IF_ID;
    id_ex: ID_EX;
    ex_mem: EX_MEM;
    mem_wb: MEM_WB;
  };
  stats: StatsSnapshot;
  hazards: HazardInfo;
  forwarding: ForwardingInfo;
  halted: boolean;
}

export interface StatsSnapshot {
  cycleCount: number;
  instructionCount: number;
  stallCount: number;
  flushCount: number;
  dataHazards: number;
  controlHazards: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface HazardInfo {
  dataStall: boolean;
  memStall: boolean;
  exStall: boolean;
  memStallCyclesRemaining: number;
  loadUseDetected: boolean;
  branchTaken: boolean;
  stallReason: string;
}

export interface ForwardingInfo {
  exmemToEx: boolean;
  memwbToEx: boolean;
  forwardRs1Source: 'none' | 'ex_mem' | 'mem_wb';
  forwardRs2Source: 'none' | 'ex_mem' | 'mem_wb';
  forwardedValue1?: number;
  forwardedValue2?: number;
}

export interface PipelineTimingEntry {
  instruction: string;
  sourceLine: number;
  stages: { cycle: number; stage: string; stalled: boolean; flushed: boolean }[];
}

export interface Breakpoint {
  line: number;
  enabled: boolean;
  condition?: string;  // Optional conditional expression
  hitCount: number;
}

export interface SimulatorConfig {
  forwardingEnabled: boolean;
  latencies: Record<string, number>;
  l1Size: number;
  l1BlockSize: number;
  l1Assoc: number;
  l1Latency: number;
  l2Size: number;
  l2BlockSize: number;
  l2Assoc: number;
  l2Latency: number;
  memLatency: number;
  cacheEnabled: boolean;
}

export const DEFAULT_CONFIG: SimulatorConfig = {
  forwardingEnabled: true,
  latencies: {
    ADD: 1, SUB: 1, ADDI: 1,
    MUL: 3,
    LW: 1, SW: 1,
    AND: 1, OR: 1, XOR: 1,
    SLL: 1, SRL: 1, SRA: 1,
  },
  l1Size: 1024,
  l1BlockSize: 64,
  l1Assoc: 2,
  l1Latency: 1,
  l2Size: 4096,
  l2BlockSize: 64,
  l2Assoc: 4,
  l2Latency: 5,
  memLatency: 50,
  cacheEnabled: false,
};

// Register ABI names
export const REG_ABI_NAMES: string[] = [
  'zero', 'ra', 'sp', 'gp', 'tp',
  't0', 't1', 't2',
  's0', 's1',
  'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11',
  't3', 't4', 't5', 't6',
];

export function isLoadInstruction(op: OPCODE): boolean {
  return op === OPCODE.LW || op === OPCODE.L || op === OPCODE.LB ||
         op === OPCODE.LH || op === OPCODE.LBU || op === OPCODE.LHU;
}

export function isStoreInstruction(op: OPCODE): boolean {
  return op === OPCODE.SW || op === OPCODE.S || op === OPCODE.SB || op === OPCODE.SH;
}

export function isBranchInstruction(op: OPCODE): boolean {
  return op === OPCODE.BNE || op === OPCODE.BEQ || op === OPCODE.BLT ||
         op === OPCODE.BGE || op === OPCODE.BLTU || op === OPCODE.BGEU;
}

export function isJumpInstruction(op: OPCODE): boolean {
  return op === OPCODE.JAL || op === OPCODE.JALR;
}

export function writesToRegister(op: OPCODE): boolean {
  return !isStoreInstruction(op) && !isBranchInstruction(op) && op !== OPCODE.NOP;
}

export function formatInstruction(inst: Instruction): string {
  if (inst.sourceText) return inst.sourceText;
  if (inst.opcode === OPCODE.NOP) return 'NOP';

  const name = OPCODE_NAMES[inst.opcode] || 'UNKNOWN';
  const parts = [name];

  if (inst.rd >= 0) parts.push(`x${inst.rd}`);
  if (inst.rs1 >= 0) parts.push(`x${inst.rs1}`);
  if (inst.rs2 >= 0) parts.push(`x${inst.rs2}`);

  if (inst.immediate !== 0 || isLoadInstruction(inst.opcode) || isStoreInstruction(inst.opcode) ||
      isBranchInstruction(inst.opcode) || isJumpInstruction(inst.opcode) ||
      inst.opcode === OPCODE.ADDI || inst.opcode === OPCODE.LUI || inst.opcode === OPCODE.AUIPC) {
    parts.push(inst.immediate.toString());
  }

  return parts.join(' ');
}
