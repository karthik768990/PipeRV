export interface PipelineStageState {
  instruction: string;    // mnemonic + operands, or "NOP" / "BUBBLE"
  opcode: string;
  rd: number | null;
  rs1: number | null;
  rs2: number | null;
  imm: number | null;
  alu_result: number | null;
  mem_address: number | null;  // must be multiple of 4 or null
  stalled: boolean;
  flushed: boolean;
  forwarded: boolean;
}

export interface SimulatorState {
  cycle: number;
  pc: number;
  registers: number[];           // x0–x31, length 32
  memory: { addr: number; value: number }[];
  pipeline: {
    IF:  PipelineStageState;
    ID:  PipelineStageState;
    EX:  PipelineStageState;
    MEM: PipelineStageState;
    WB:  PipelineStageState;
  };
  forwarding: {
    exmem_to_ex: boolean;
    memwb_to_ex: boolean;
    ex_forward_rs1: boolean;
    ex_forward_rs2: boolean;
  };
  hazards: {
    data_stall: boolean;
    mem_stall: boolean;
    mem_stall_cycles_remaining: number;
    load_use_detected: boolean;
  };
  stats: {
    cycle_count: number;
    instruction_count: number;
    stall_count: number;
    ipc: number;
  };
  halted: boolean;
}
