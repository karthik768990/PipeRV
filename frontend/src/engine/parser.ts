// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - Assembly Parser
// Full RISC-V assembly parser with label support, matching C++ Parser
// ═══════════════════════════════════════════════════════════════════════

import { OPCODE, Instruction, createNOP } from './types';

export interface ParseError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  instructions: Instruction[];
  errors: ParseError[];
  labelMap: Map<string, number>;
  sourceLines: string[];
}

const OPCODE_MAP: Record<string, OPCODE> = {
  'NOP': OPCODE.NOP,
  'ADD': OPCODE.ADD,
  'SUB': OPCODE.SUB,
  'ADDI': OPCODE.ADDI,
  'LW': OPCODE.LW,
  'SW': OPCODE.SW,
  'BNE': OPCODE.BNE,
  'JAL': OPCODE.JAL,
  'BLT': OPCODE.BLT,
  'BGE': OPCODE.BGE,
  'L': OPCODE.L,
  'S': OPCODE.S,
  'MUL': OPCODE.MUL,
  'AND': OPCODE.AND,
  'OR': OPCODE.OR,
  'XOR': OPCODE.XOR,
  'ANDI': OPCODE.ANDI,
  'ORI': OPCODE.ORI,
  'XORI': OPCODE.XORI,
  'SLL': OPCODE.SLL,
  'SRL': OPCODE.SRL,
  'SRA': OPCODE.SRA,
  'SLLI': OPCODE.SLLI,
  'SRLI': OPCODE.SRLI,
  'SRAI': OPCODE.SRAI,
  'SLT': OPCODE.SLT,
  'SLTU': OPCODE.SLTU,
  'SLTI': OPCODE.SLTI,
  'SLTIU': OPCODE.SLTIU,
  'BEQ': OPCODE.BEQ,
  'BGEU': OPCODE.BGEU,
  'BLTU': OPCODE.BLTU,
  'LUI': OPCODE.LUI,
  'AUIPC': OPCODE.AUIPC,
  'JALR': OPCODE.JALR,
};

// R-type: op rd, rs1, rs2
const R_TYPE_OPS = new Set([
  OPCODE.ADD, OPCODE.SUB, OPCODE.MUL,
  OPCODE.AND, OPCODE.OR, OPCODE.XOR,
  OPCODE.SLL, OPCODE.SRL, OPCODE.SRA,
  OPCODE.SLT, OPCODE.SLTU,
]);

// I-type arithmetic: op rd, rs1, imm
const I_TYPE_ARITH = new Set([
  OPCODE.ADDI, OPCODE.ANDI, OPCODE.ORI, OPCODE.XORI,
  OPCODE.SLLI, OPCODE.SRLI, OPCODE.SRAI,
  OPCODE.SLTI, OPCODE.SLTIU,
]);

// Branch-type: op rs1, rs2, label
const B_TYPE_OPS = new Set([
  OPCODE.BNE, OPCODE.BEQ, OPCODE.BLT, OPCODE.BGE,
  OPCODE.BLTU, OPCODE.BGEU,
]);

export class Parser {
  private labelMap: Map<string, number> = new Map();
  private errors: ParseError[] = [];

  parseRegister(regStr: string, lineNum: number): number {
    const s = regStr.trim().toLowerCase();

    // x0-x31
    if (s.startsWith('x')) {
      const num = parseInt(s.substring(1), 10);
      if (isNaN(num) || num < 0 || num > 31) {
        this.errors.push({ line: lineNum, message: `Invalid register: ${regStr}`, severity: 'error' });
        return 0;
      }
      return num;
    }

    // ABI names
    const abiMap: Record<string, number> = {
      'zero': 0, 'ra': 1, 'sp': 2, 'gp': 3, 'tp': 4,
      't0': 5, 't1': 6, 't2': 7,
      's0': 8, 'fp': 8, 's1': 9,
      'a0': 10, 'a1': 11, 'a2': 12, 'a3': 13, 'a4': 14, 'a5': 15, 'a6': 16, 'a7': 17,
      's2': 18, 's3': 19, 's4': 20, 's5': 21, 's6': 22, 's7': 23, 's8': 24, 's9': 25, 's10': 26, 's11': 27,
      't3': 28, 't4': 29, 't5': 30, 't6': 31,
    };

    if (abiMap[s] !== undefined) return abiMap[s];

    this.errors.push({ line: lineNum, message: `Unknown register: ${regStr}`, severity: 'error' });
    return 0;
  }

  parseImmediate(immStr: string, lineNum: number): number {
    const s = immStr.trim();
    let value: number;

    if (s.startsWith('0x') || s.startsWith('0X')) {
      value = parseInt(s, 16);
    } else if (s.startsWith('0b') || s.startsWith('0B')) {
      value = parseInt(s.substring(2), 2);
    } else {
      value = parseInt(s, 10);
    }

    if (isNaN(value)) {
      this.errors.push({ line: lineNum, message: `Invalid immediate value: ${immStr}`, severity: 'error' });
      return 0;
    }

    return value | 0; // Sign-extend to 32-bit
  }

  tokenize(line: string): string[] {
    // Replace commas and parentheses with spaces
    const cleaned = line.replace(/[,()]/g, ' ');
    return cleaned.split(/\s+/).filter(t => t.length > 0);
  }

  parseLineToInstruction(line: string, lineNum: number): Instruction | null {
    const tokens = this.tokenize(line);
    if (tokens.length === 0) return null;

    const opStr = tokens[0].toUpperCase();

    // Handle NOP pseudo-instruction
    if (opStr === 'NOP') {
      const inst = createNOP();
      inst.sourceText = line;
      inst.sourceLine = lineNum;
      return inst;
    }

    const opcode = OPCODE_MAP[opStr];
    if (opcode === undefined) {
      this.errors.push({ line: lineNum, message: `Unknown instruction: ${tokens[0]}`, severity: 'error' });
      return null;
    }

    try {
      // R-type: op rd, rs1, rs2
      if (R_TYPE_OPS.has(opcode)) {
        if (tokens.length < 4) {
          this.errors.push({ line: lineNum, message: `${opStr} requires 3 operands: rd, rs1, rs2`, severity: 'error' });
          return null;
        }
        return {
          opcode,
          rd: this.parseRegister(tokens[1], lineNum),
          rs1: this.parseRegister(tokens[2], lineNum),
          rs2: this.parseRegister(tokens[3], lineNum),
          immediate: 0,
          sourceText: line,
          sourceLine: lineNum,
        };
      }

      // I-type arithmetic: op rd, rs1, imm
      if (I_TYPE_ARITH.has(opcode)) {
        if (tokens.length < 4) {
          this.errors.push({ line: lineNum, message: `${opStr} requires 3 operands: rd, rs1, imm`, severity: 'error' });
          return null;
        }
        return {
          opcode,
          rd: this.parseRegister(tokens[1], lineNum),
          rs1: this.parseRegister(tokens[2], lineNum),
          rs2: -1,
          immediate: this.parseImmediate(tokens[3], lineNum),
          sourceText: line,
          sourceLine: lineNum,
        };
      }

      // LW: lw rd, offset(rs1)  or  lw rd, rs1  (simple format)
      if (opcode === OPCODE.LW) {
        if (tokens.length >= 4) {
          // lw rd, offset, rs1 (parentheses already stripped)
          return {
            opcode,
            rd: this.parseRegister(tokens[1], lineNum),
            rs1: this.parseRegister(tokens[3], lineNum),
            rs2: -1,
            immediate: this.parseImmediate(tokens[2], lineNum),
            sourceText: line,
            sourceLine: lineNum,
          };
        } else if (tokens.length === 3) {
          // lw rd, addr (simple trace-like format)
          const p1 = tokens[1], p2 = tokens[2];
          if (p1.startsWith('0x') || p1.startsWith('0X') || /^\d+$/.test(p1)) {
            return {
              opcode: OPCODE.L,
              rd: this.parseRegister(p2, lineNum),
              rs1: -1, rs2: -1,
              immediate: this.parseImmediate(p1, lineNum),
              sourceText: line, sourceLine: lineNum,
            };
          }
          return {
            opcode: OPCODE.L,
            rd: this.parseRegister(p1, lineNum),
            rs1: -1, rs2: -1,
            immediate: this.parseImmediate(p2, lineNum),
            sourceText: line, sourceLine: lineNum,
          };
        }
        this.errors.push({ line: lineNum, message: `LW requires operands`, severity: 'error' });
        return null;
      }

      // SW: sw rs2, offset(rs1)
      if (opcode === OPCODE.SW) {
        if (tokens.length >= 4) {
          return {
            opcode,
            rd: -1,
            rs1: this.parseRegister(tokens[3], lineNum),
            rs2: this.parseRegister(tokens[1], lineNum),
            immediate: this.parseImmediate(tokens[2], lineNum),
            sourceText: line,
            sourceLine: lineNum,
          };
        } else if (tokens.length === 3) {
          const p1 = tokens[1], p2 = tokens[2];
          if (p1.startsWith('0x') || p1.startsWith('0X') || /^\d+$/.test(p1)) {
            return {
              opcode: OPCODE.S,
              rd: -1,
              rs1: this.parseRegister(p2, lineNum),
              rs2: -1,
              immediate: this.parseImmediate(p1, lineNum),
              sourceText: line, sourceLine: lineNum,
            };
          }
          return {
            opcode: OPCODE.S,
            rd: -1,
            rs1: this.parseRegister(p1, lineNum),
            rs2: -1,
            immediate: this.parseImmediate(p2, lineNum),
            sourceText: line, sourceLine: lineNum,
          };
        }
        this.errors.push({ line: lineNum, message: `SW requires operands`, severity: 'error' });
        return null;
      }

      // Branch: op rs1, rs2, label/offset
      if (B_TYPE_OPS.has(opcode)) {
        if (tokens.length < 4) {
          this.errors.push({ line: lineNum, message: `${opStr} requires 3 operands: rs1, rs2, target`, severity: 'error' });
          return null;
        }
        let target: number;
        const targetStr = tokens[3];
        if (this.labelMap.has(targetStr)) {
          target = this.labelMap.get(targetStr)!;
        } else {
          target = this.parseImmediate(targetStr, lineNum);
        }
        return {
          opcode,
          rd: -1,
          rs1: this.parseRegister(tokens[1], lineNum),
          rs2: this.parseRegister(tokens[2], lineNum),
          immediate: target,
          sourceText: line,
          sourceLine: lineNum,
        };
      }

      // JAL: jal rd, label/offset
      if (opcode === OPCODE.JAL) {
        if (tokens.length < 3) {
          this.errors.push({ line: lineNum, message: `JAL requires 2 operands: rd, target`, severity: 'error' });
          return null;
        }
        let target: number;
        const targetStr = tokens[2];
        if (this.labelMap.has(targetStr)) {
          target = this.labelMap.get(targetStr)!;
        } else {
          target = this.parseImmediate(targetStr, lineNum);
        }
        return {
          opcode,
          rd: this.parseRegister(tokens[1], lineNum),
          rs1: -1, rs2: -1,
          immediate: target,
          sourceText: line,
          sourceLine: lineNum,
        };
      }

      // JALR: jalr rd, rs1, offset
      if (opcode === OPCODE.JALR) {
        if (tokens.length < 4) {
          this.errors.push({ line: lineNum, message: `JALR requires 3 operands: rd, rs1, offset`, severity: 'error' });
          return null;
        }
        return {
          opcode,
          rd: this.parseRegister(tokens[1], lineNum),
          rs1: this.parseRegister(tokens[2], lineNum),
          rs2: -1,
          immediate: this.parseImmediate(tokens[3], lineNum),
          sourceText: line,
          sourceLine: lineNum,
        };
      }

      // LUI / AUIPC: op rd, imm
      if (opcode === OPCODE.LUI || opcode === OPCODE.AUIPC) {
        if (tokens.length < 3) {
          this.errors.push({ line: lineNum, message: `${opStr} requires 2 operands: rd, imm`, severity: 'error' });
          return null;
        }
        return {
          opcode,
          rd: this.parseRegister(tokens[1], lineNum),
          rs1: -1, rs2: -1,
          immediate: this.parseImmediate(tokens[2], lineNum),
          sourceText: line,
          sourceLine: lineNum,
        };
      }

      // Trace-format L/S
      if (opcode === OPCODE.L) {
        const offset = this.parseImmediate(tokens[1], lineNum);
        const rd = this.parseRegister(tokens[2], lineNum);
        return { opcode, rd, rs1: -1, rs2: -1, immediate: offset, sourceText: line, sourceLine: lineNum };
      }
      if (opcode === OPCODE.S) {
        const offset = this.parseImmediate(tokens[1], lineNum);
        const rs1 = this.parseRegister(tokens[2], lineNum);
        return { opcode, rd: -1, rs1, rs2: -1, immediate: offset, sourceText: line, sourceLine: lineNum };
      }

      this.errors.push({ line: lineNum, message: `Unhandled instruction format: ${line}`, severity: 'error' });
      return null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.errors.push({ line: lineNum, message: `Parse error: ${msg}`, severity: 'error' });
      return null;
    }
  }

  parse(text: string): ParseResult {
    this.labelMap = new Map();
    this.errors = [];

    const rawLines = text.split('\n');
    const sourceLines = rawLines.map(l => l);

    // Clean and extract lines
    const processedLines: { text: string; originalLine: number }[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];
      // Remove comments
      const hashIdx = line.indexOf('#');
      if (hashIdx >= 0) line = line.substring(0, hashIdx);
      const slashIdx = line.indexOf('//');
      if (slashIdx >= 0) line = line.substring(0, slashIdx);
      line = line.trim();
      if (line.length === 0) continue;

      processedLines.push({ text: line, originalLine: i + 1 });
    }

    // Pass 1: Build label map
    let instrIndex = 0;
    const finalLines: { text: string; originalLine: number }[] = [];

    for (const pl of processedLines) {
      let line = pl.text;

      if (line.includes(':')) {
        const colonPos = line.indexOf(':');
        const label = line.substring(0, colonPos).trim();
        this.labelMap.set(label, instrIndex);

        line = line.substring(colonPos + 1).trim();
        if (line.length === 0) continue;
      }

      finalLines.push({ text: line, originalLine: pl.originalLine });
      instrIndex++;
    }

    // Pass 2: Parse instructions
    const instructions: Instruction[] = [];

    for (const fl of finalLines) {
      let line = fl.text;

      // Strip label if still present
      if (line.includes(':')) {
        line = line.substring(line.indexOf(':') + 1).trim();
        if (line.length === 0) continue;
      }

      const inst = this.parseLineToInstruction(line, fl.originalLine);
      if (inst) {
        instructions.push(inst);
      }
    }

    return {
      instructions,
      errors: [...this.errors],
      labelMap: new Map(this.labelMap),
      sourceLines,
    };
  }
}
