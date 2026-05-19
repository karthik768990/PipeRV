// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - Pipeline
// 5-stage pipeline: IF → ID → EX → MEM → WB
// Mirrors C++ Pipeline.cpp with hazard detection and forwarding
// ═══════════════════════════════════════════════════════════════════════

import {
  OPCODE, Instruction, createNOP,
  IF_ID, ID_EX, EX_MEM, MEM_WB,
  HazardInfo, ForwardingInfo,
  isLoadInstruction, isStoreInstruction, isBranchInstruction,
  writesToRegister, SimulatorConfig,
} from './types';
import { RegisterFile } from './registerFile';
import { Memory } from './memory';
import { Cache } from './cache';


export interface PipelineStepResult {
  hazards: HazardInfo;
  forwarding: ForwardingInfo;
  branchTaken: boolean;
  branchTarget: number;
  completedInstruction: Instruction | null;
  wbRegister: number;
  wbValue: number;
}

export class Pipeline {
  // Pipeline registers
  if_id: IF_ID;
  id_ex: ID_EX;
  ex_mem: EX_MEM;
  mem_wb: MEM_WB;

  // Internal state
  private memStallCycles: number = 0;
  private ifStallCycles: number = 0;
  private exCyclesRemaining: number = 0;
  private memAccessInProgress: boolean = false;

  // Stats
  stallCount: number = 0;
  flushCount: number = 0;
  dataHazardCount: number = 0;
  controlHazardCount: number = 0;

  constructor() {
    this.if_id = { instruction: createNOP(), pc: -1 };
    this.id_ex = { instruction: createNOP(), pc: -1, operand1: 0, operand2: 0 };
    this.ex_mem = { instruction: createNOP(), aluResult: 0, operand2: 0 };
    this.mem_wb = { instruction: createNOP(), writeData: 0 };
  }

  reset(): void {
    this.if_id = { instruction: createNOP(), pc: -1 };
    this.id_ex = { instruction: createNOP(), pc: -1, operand1: 0, operand2: 0 };
    this.ex_mem = { instruction: createNOP(), aluResult: 0, operand2: 0 };
    this.mem_wb = { instruction: createNOP(), writeData: 0 };
    this.memStallCycles = 0;
    this.ifStallCycles = 0;
    this.exCyclesRemaining = 0;
    this.memAccessInProgress = false;
    this.stallCount = 0;
    this.flushCount = 0;
    this.dataHazardCount = 0;
    this.controlHazardCount = 0;
  }

  getMemStallCycles(): number {
    return this.memStallCycles;
  }

  hasPendingInstructions(): boolean {
    return this.if_id.instruction.opcode !== OPCODE.NOP ||
           this.id_ex.instruction.opcode !== OPCODE.NOP ||
           this.ex_mem.instruction.opcode !== OPCODE.NOP ||
           this.mem_wb.instruction.opcode !== OPCODE.NOP;
  }

  step(
    instructions: Instruction[],
    pc: { value: number },
    registerFile: RegisterFile,
    memory: Memory,
    config: SimulatorConfig,
    l1Cache?: Cache | null,
    l2Cache?: Cache | null,
    cycleCount?: number,
  ): PipelineStepResult {
    const forwarding: ForwardingInfo = {
      exmemToEx: false, memwbToEx: false,
      forwardRs1Source: 'none', forwardRs2Source: 'none',
    };

    let branchTaken = false;
    let branchTarget = -1;
    let stallReason = '';

    // Create next-state buffers
    let next_if_id = { ...this.if_id, instruction: { ...this.if_id.instruction } };
    let next_id_ex = { ...this.id_ex, instruction: { ...this.id_ex.instruction } };
    let next_ex_mem = { ...this.ex_mem, instruction: { ...this.ex_mem.instruction } };
    let next_mem_wb = { ...this.mem_wb, instruction: { ...this.mem_wb.instruction } };

    // ═══════════════════════════════════════════════════════
    // 0. WB STAGE (Write Back - falling edge)
    // ═══════════════════════════════════════════════════════
    const wbInst = this.mem_wb.instruction;
    let completedInstruction: Instruction | null = null;
    let wbRegister = -1;
    let wbValue = 0;

    if (wbInst.opcode !== OPCODE.NOP) {
      if (wbInst.rd > 0 && writesToRegister(wbInst.opcode)) {
        registerFile.write(wbInst.rd, this.mem_wb.writeData);
        wbRegister = wbInst.rd;
        wbValue = this.mem_wb.writeData;
      }
      completedInstruction = wbInst;
    }

    // ═══════════════════════════════════════════════════════
    // 1. MULTI-CYCLE EXECUTION CHECK
    // ═══════════════════════════════════════════════════════
    let exStall = false;

    if (this.id_ex.instruction.opcode !== OPCODE.NOP) {
      if (this.exCyclesRemaining === 0) {
        const opName = OPCODE[this.id_ex.instruction.opcode];
        this.exCyclesRemaining = config.latencies[opName] || 1;
      }

      if (this.exCyclesRemaining > 1) {
        exStall = true;
        this.exCyclesRemaining--;
      } else {
        this.exCyclesRemaining = 0;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 2. HAZARD DETECTION
    // ═══════════════════════════════════════════════════════
    let dataStall = this.detectLoadUseHazard(this.if_id, this.id_ex);

    // Without forwarding: stall on any RAW dependency
    if (!config.forwardingEnabled) {
      const rs1 = this.if_id.instruction.rs1;
      const rs2 = this.if_id.instruction.rs2;

      const isWriting = (rs: number, inst: Instruction): boolean => {
        return rs > 0 && inst.rd === rs && writesToRegister(inst.opcode) && inst.opcode !== OPCODE.NOP;
      };

      if (isWriting(rs1, this.id_ex.instruction) || isWriting(rs2, this.id_ex.instruction) ||
          isWriting(rs1, this.ex_mem.instruction) || isWriting(rs2, this.ex_mem.instruction)) {
        dataStall = true;
      }
    }

    if (dataStall) {
      stallReason = 'Data hazard: register dependency detected';
      this.dataHazardCount++;
    }

    // ═══════════════════════════════════════════════════════
    // 3. MEM STAGE
    // ═══════════════════════════════════════════════════════
    next_mem_wb.instruction = { ...this.ex_mem.instruction };
    const memInst = this.ex_mem.instruction;

    if (this.memStallCycles > 0) {
      this.memStallCycles--;
      this.stallCount++;
      if (this.memStallCycles > 0) {
        next_mem_wb.instruction = createNOP(); // Bubble
      }
    } else {
      if ((isLoadInstruction(memInst.opcode) || isStoreInstruction(memInst.opcode)) && !this.memAccessInProgress) {
        this.memAccessInProgress = true;
        
        let totalLatency = 1;
        if (config.cacheEnabled && l1Cache && l2Cache) {
          const addr = this.ex_mem.aluResult;
          // Access L1 Cache
          const l1Hit = l1Cache.access(addr, cycleCount || 0);
          if (l1Hit) {
            totalLatency = config.l1Latency;
          } else {
            // L1 Miss: Access L2 Cache
            const l2Hit = l2Cache.access(addr, cycleCount || 0);
            if (l2Hit) {
              totalLatency = config.l1Latency + config.l2Latency;
            } else {
              // L2 Miss: Access Main Memory
              totalLatency = config.l1Latency + config.l2Latency + config.memLatency;
            }
          }
        } else if (config.cacheEnabled) {
          totalLatency = config.l1Latency;
        }

        if (totalLatency > 1) {
          this.memStallCycles = totalLatency - 1;
          this.stallCount++;
          next_mem_wb.instruction = createNOP();
        }
      }
    }


    let memStall = this.memStallCycles > 0;

    if (!memStall) {
      const addr = this.ex_mem.aluResult;
      if (isLoadInstruction(memInst.opcode)) {
        try {
          next_mem_wb.writeData = memory.load(addr);
        } catch {
          next_mem_wb.writeData = 0;
        }
      } else if (isStoreInstruction(memInst.opcode)) {
        try {
          memory.store(addr, this.ex_mem.operand2);
        } catch {
          // Memory error - ignore silently
        }
        next_mem_wb.writeData = 0;
      } else {
        next_mem_wb.writeData = this.ex_mem.aluResult;
      }
      this.memAccessInProgress = false;
    }

    if (memStall && !stallReason) {
      stallReason = 'Memory stall: cache miss or memory latency';
    }

    // ═══════════════════════════════════════════════════════
    // 4. IF STAGE
    // ═══════════════════════════════════════════════════════
    if (exStall || dataStall || memStall) {
      next_if_id = { ...this.if_id, instruction: { ...this.if_id.instruction } }; // Freeze
      if (this.ifStallCycles > 0) this.ifStallCycles--;
    } else {
      if (this.ifStallCycles > 0) {
        this.ifStallCycles--;
        this.stallCount++;
        next_if_id = { instruction: createNOP(), pc: -1 };
      } else {
        if (pc.value < instructions.length) {
          next_if_id.instruction = { ...instructions[pc.value] };
          next_if_id.pc = pc.value;
          pc.value++;
        } else {
          next_if_id.instruction = createNOP();
          next_if_id.pc = -1;
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // 5. ID STAGE
    // ═══════════════════════════════════════════════════════
    if (exStall || memStall) {
      next_id_ex = { ...this.id_ex, instruction: { ...this.id_ex.instruction } }; // Freeze
    } else if (dataStall) {
      this.stallCount++;
      next_id_ex = { instruction: createNOP(), pc: -1, operand1: 0, operand2: 0 }; // Bubble
    } else {
      next_id_ex.instruction = { ...this.if_id.instruction };
      next_id_ex.pc = this.if_id.pc;

      const idInst = this.if_id.instruction;
      next_id_ex.operand1 = idInst.rs1 >= 0 ? registerFile.read(idInst.rs1) : 0;
      next_id_ex.operand2 = idInst.rs2 >= 0 ? registerFile.read(idInst.rs2) : 0;
    }

    // ═══════════════════════════════════════════════════════
    // 6. EX STAGE
    // ═══════════════════════════════════════════════════════
    if (exStall || memStall) {
      next_ex_mem = { ...this.ex_mem, instruction: { ...this.ex_mem.instruction } }; // Freeze
    } else {
      const exInst = this.id_ex.instruction;
      let op1 = this.id_ex.operand1;
      let op2 = this.id_ex.operand2;

      // Forwarding logic
      if (config.forwardingEnabled) {
        const fwd = this.resolveForwarding(this.id_ex, this.ex_mem, this.mem_wb, op1, op2);
        op1 = fwd.op1;
        op2 = fwd.op2;
        forwarding.exmemToEx = fwd.exmemToEx;
        forwarding.memwbToEx = fwd.memwbToEx;
        forwarding.forwardRs1Source = fwd.rs1Source;
        forwarding.forwardRs2Source = fwd.rs2Source;
        forwarding.forwardedValue1 = fwd.fwdVal1;
        forwarding.forwardedValue2 = fwd.fwdVal2;
      }

      next_ex_mem.instruction = { ...exInst };
      next_ex_mem.operand2 = 0;
      next_ex_mem.aluResult = 0;

      // ALU operations
      switch (exInst.opcode) {
        case OPCODE.ADD:  next_ex_mem.aluResult = (op1 + op2) | 0; break;
        case OPCODE.SUB:  next_ex_mem.aluResult = (op1 - op2) | 0; break;
        case OPCODE.ADDI: next_ex_mem.aluResult = (op1 + exInst.immediate) | 0; break;
        case OPCODE.MUL:  next_ex_mem.aluResult = Math.imul(op1, op2); break;
        case OPCODE.AND:  next_ex_mem.aluResult = op1 & op2; break;
        case OPCODE.OR:   next_ex_mem.aluResult = op1 | op2; break;
        case OPCODE.XOR:  next_ex_mem.aluResult = op1 ^ op2; break;
        case OPCODE.ANDI: next_ex_mem.aluResult = op1 & exInst.immediate; break;
        case OPCODE.ORI:  next_ex_mem.aluResult = op1 | exInst.immediate; break;
        case OPCODE.XORI: next_ex_mem.aluResult = op1 ^ exInst.immediate; break;
        case OPCODE.SLL:  next_ex_mem.aluResult = (op1 << (op2 & 0x1f)) | 0; break;
        case OPCODE.SRL:  next_ex_mem.aluResult = op1 >>> (op2 & 0x1f); break;
        case OPCODE.SRA:  next_ex_mem.aluResult = op1 >> (op2 & 0x1f); break;
        case OPCODE.SLLI: next_ex_mem.aluResult = (op1 << (exInst.immediate & 0x1f)) | 0; break;
        case OPCODE.SRLI: next_ex_mem.aluResult = op1 >>> (exInst.immediate & 0x1f); break;
        case OPCODE.SRAI: next_ex_mem.aluResult = op1 >> (exInst.immediate & 0x1f); break;
        case OPCODE.SLT:  next_ex_mem.aluResult = op1 < op2 ? 1 : 0; break;
        case OPCODE.SLTU: next_ex_mem.aluResult = (op1 >>> 0) < (op2 >>> 0) ? 1 : 0; break;
        case OPCODE.SLTI: next_ex_mem.aluResult = op1 < exInst.immediate ? 1 : 0; break;
        case OPCODE.SLTIU:next_ex_mem.aluResult = (op1 >>> 0) < (exInst.immediate >>> 0) ? 1 : 0; break;
        case OPCODE.LUI:  next_ex_mem.aluResult = exInst.immediate << 12; break;
        case OPCODE.AUIPC:next_ex_mem.aluResult = (this.id_ex.pc * 4 + (exInst.immediate << 12)) | 0; break;

        // Load/Store address calculation
        case OPCODE.LW:
        case OPCODE.LB:
        case OPCODE.LH:
        case OPCODE.LBU:
        case OPCODE.LHU:
          next_ex_mem.aluResult = (op1 + exInst.immediate) | 0;
          break;
        case OPCODE.L:
          next_ex_mem.aluResult = exInst.immediate;
          break;
        case OPCODE.SW:
        case OPCODE.SB:
        case OPCODE.SH:
          next_ex_mem.aluResult = (op1 + exInst.immediate) | 0;
          next_ex_mem.operand2 = op2;
          break;
        case OPCODE.S:
          next_ex_mem.aluResult = exInst.immediate;
          next_ex_mem.operand2 = op1;
          break;

        // Branches
        case OPCODE.BNE:
          if (op1 !== op2) {
            branchTaken = true;
            branchTarget = exInst.immediate;
          }
          break;
        case OPCODE.BEQ:
          if (op1 === op2) {
            branchTaken = true;
            branchTarget = exInst.immediate;
          }
          break;
        case OPCODE.BLT:
          if (op1 < op2) {
            branchTaken = true;
            branchTarget = exInst.immediate;
          }
          break;
        case OPCODE.BGE:
          if (op1 >= op2) {
            branchTaken = true;
            branchTarget = exInst.immediate;
          }
          break;
        case OPCODE.BLTU:
          if ((op1 >>> 0) < (op2 >>> 0)) {
            branchTaken = true;
            branchTarget = exInst.immediate;
          }
          break;
        case OPCODE.BGEU:
          if ((op1 >>> 0) >= (op2 >>> 0)) {
            branchTaken = true;
            branchTarget = exInst.immediate;
          }
          break;

        // Jumps
        case OPCODE.JAL:
          next_ex_mem.aluResult = this.id_ex.pc + 1;
          branchTaken = true;
          branchTarget = exInst.immediate;
          break;
        case OPCODE.JALR:
          next_ex_mem.aluResult = this.id_ex.pc + 1;
          branchTaken = true;
          branchTarget = ((op1 + exInst.immediate) & ~1) >> 2; // Convert to instruction index
          break;
      }

      // Handle branch/jump: flush IF and ID stages
      if (branchTaken) {
        pc.value = branchTarget;
        next_if_id = { instruction: createNOP(), pc: -1 };
        next_id_ex = { instruction: createNOP(), pc: -1, operand1: 0, operand2: 0 };
        this.ifStallCycles = 0;
        this.flushCount++;
        this.controlHazardCount++;
        stallReason = stallReason || `Branch/jump taken → PC = ${branchTarget}`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 7. CLOCK EDGE: Commit next state
    // ═══════════════════════════════════════════════════════
    this.if_id = next_if_id;
    this.id_ex = next_id_ex;
    this.ex_mem = next_ex_mem;
    this.mem_wb = next_mem_wb;

    const hazards: HazardInfo = {
      dataStall,
      memStall,
      exStall,
      memStallCyclesRemaining: this.memStallCycles,
      loadUseDetected: this.detectLoadUseHazard(
        { instruction: this.if_id.instruction, pc: this.if_id.pc },
        this.id_ex
      ),
      branchTaken,
      stallReason,
    };

    return {
      hazards,
      forwarding,
      branchTaken,
      branchTarget,
      completedInstruction,
      wbRegister,
      wbValue,
    };
  }

  private detectLoadUseHazard(if_id: IF_ID, id_ex: ID_EX): boolean {
    const exInst = id_ex.instruction;
    const idInst = if_id.instruction;

    if (exInst.opcode === OPCODE.LW || exInst.opcode === OPCODE.L) {
      const loadDest = exInst.rd;
      if (loadDest > 0) {
        if (loadDest === idInst.rs1 || loadDest === idInst.rs2) {
          return true;
        }
      }
    }
    return false;
  }

  private resolveForwarding(
    id_ex: ID_EX, ex_mem: EX_MEM, mem_wb: MEM_WB,
    op1: number, op2: number,
  ): {
    op1: number; op2: number;
    exmemToEx: boolean; memwbToEx: boolean;
    rs1Source: 'none' | 'ex_mem' | 'mem_wb';
    rs2Source: 'none' | 'ex_mem' | 'mem_wb';
    fwdVal1?: number; fwdVal2?: number;
  } {
    const rs1 = id_ex.instruction.rs1;
    const rs2 = id_ex.instruction.rs2;
    let exmemToEx = false, memwbToEx = false;
    let rs1Source: 'none' | 'ex_mem' | 'mem_wb' = 'none';
    let rs2Source: 'none' | 'ex_mem' | 'mem_wb' = 'none';
    let fwdVal1: number | undefined, fwdVal2: number | undefined;

    const canForwardExMem = (rs: number): boolean => {
      return rs >= 0 && ex_mem.instruction.rd === rs && ex_mem.instruction.rd > 0 &&
             writesToRegister(ex_mem.instruction.opcode) &&
             !isLoadInstruction(ex_mem.instruction.opcode) &&
             ex_mem.instruction.opcode !== OPCODE.NOP;
    };

    const canForwardMemWb = (rs: number): boolean => {
      return rs >= 0 && mem_wb.instruction.rd === rs && mem_wb.instruction.rd > 0 &&
             writesToRegister(mem_wb.instruction.opcode) &&
             mem_wb.instruction.opcode !== OPCODE.NOP;
    };

    if (rs1 >= 0) {
      if (canForwardExMem(rs1)) {
        op1 = ex_mem.aluResult;
        exmemToEx = true;
        rs1Source = 'ex_mem';
        fwdVal1 = op1;
      } else if (canForwardMemWb(rs1)) {
        op1 = mem_wb.writeData;
        memwbToEx = true;
        rs1Source = 'mem_wb';
        fwdVal1 = op1;
      }
    }

    if (rs2 >= 0) {
      if (canForwardExMem(rs2)) {
        op2 = ex_mem.aluResult;
        exmemToEx = true;
        rs2Source = 'ex_mem';
        fwdVal2 = op2;
      } else if (canForwardMemWb(rs2)) {
        op2 = mem_wb.writeData;
        memwbToEx = true;
        rs2Source = 'mem_wb';
        fwdVal2 = op2;
      }
    }

    return { op1, op2, exmemToEx, memwbToEx, rs1Source, rs2Source, fwdVal1, fwdVal2 };
  }
}
