export enum OPCODE {
  NOP = "NOP",
  ADD = "ADD",
  SUB = "SUB",
  ADDI = "ADDI",
  LW = "LW",
  SW = "SW",
  BNE = "BNE",
  JAL = "JAL",
  BLT = "BLT",
  BGE = "BGE",
}

export interface ParsedInstruction {
  opcode: OPCODE;
  rd: number | null;
  rs1: number | null;
  rs2: number | null;
  immediate: number | null;
}
