import { OPCODE, ParsedInstruction } from '../types/instruction';

export class Assembler {
  private labelMap = new Map<string, number>();

  public parseRegister(regStr: string): number {
    regStr = regStr.toLowerCase();
    if (regStr.startsWith('x')) {
      const num = parseInt(regStr.substring(1), 10);
      if (num >= 0 && num <= 31) return num;
    }
    const abiMap: {[key: string]: number} = {
      zero: 0, ra: 1, sp: 2, gp: 3, tp: 4, t0: 5, t1: 6, t2: 7, s0: 8, fp: 8, s1: 9,
      a0: 10, a1: 11, a2: 12, a3: 13, a4: 14, a5: 15, a6: 16, a7: 17,
      s2: 18, s3: 19, s4: 20, s5: 21, s6: 22, s7: 23, s8: 24, s9: 25, s10: 26, s11: 27,
      t3: 28, t4: 29, t5: 30, t6: 31
    };
    return abiMap[regStr] ?? -1;
  }

  public assemble(text: string): { instructions: ParsedInstruction[], errors: string[] } {
    const lines = text.split('\n');
    const cleanedLines = lines.map(line => {
      let l = line.split('#')[0].trim();
      return l;
    });

    const errors: string[] = [];
    this.labelMap.clear();

    // Pass 1: Build label map
    let instCount = 0;
    for (let i = 0; i < cleanedLines.length; i++) {
      let line = cleanedLines[i];
      if (!line) continue;

      if (line.includes(':')) {
        const parts = line.split(':');
        const label = parts[0].trim();
        this.labelMap.set(label, instCount);
        line = parts[1].trim();
        cleanedLines[i] = line;
      }

      if (line) instCount++;
    }

    // Pass 2: Parse instructions
    const instructions: ParsedInstruction[] = [];
    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      if (!line) continue;

      const tokens = line.replace(/,/g, ' ').replace(/\(/g, ' ').replace(/\)/g, ' ').split(/\s+/).filter(t => t);
      if (tokens.length === 0) continue;

      const opStr = tokens[0].toUpperCase();
      let inst: ParsedInstruction = { opcode: OPCODE.NOP, rd: null, rs1: null, rs2: null, immediate: null };

      try {
        switch (opStr) {
          case 'ADD':
          case 'SUB':
            inst.opcode = OPCODE[opStr as keyof typeof OPCODE];
            inst.rd = this.parseRegister(tokens[1]);
            inst.rs1 = this.parseRegister(tokens[2]);
            inst.rs2 = this.parseRegister(tokens[3]);
            break;
          case 'ADDI':
            inst.opcode = OPCODE.ADDI;
            inst.rd = this.parseRegister(tokens[1]);
            inst.rs1 = this.parseRegister(tokens[2]);
            inst.immediate = parseInt(tokens[3], 10);
            break;
          case 'LW':
            inst.opcode = OPCODE.LW;
            inst.rd = this.parseRegister(tokens[1]);
            inst.immediate = parseInt(tokens[2], 10);
            inst.rs1 = this.parseRegister(tokens[3]);
            break;
          case 'SW':
            inst.opcode = OPCODE.SW;
            inst.rs2 = this.parseRegister(tokens[1]);
            inst.immediate = parseInt(tokens[2], 10);
            inst.rs1 = this.parseRegister(tokens[3]);
            break;
          case 'BNE':
          case 'BLT':
          case 'BGE':
            inst.opcode = OPCODE[opStr as keyof typeof OPCODE];
            inst.rs1 = this.parseRegister(tokens[1]);
            inst.rs2 = this.parseRegister(tokens[2]);
            inst.immediate = this.labelMap.get(tokens[3]) ?? 0;
            break;
          case 'JAL':
            inst.opcode = OPCODE.JAL;
            inst.rd = this.parseRegister(tokens[1]);
            inst.immediate = this.labelMap.get(tokens[2]) ?? 0;
            break;
          case 'NOP':
            inst.opcode = OPCODE.NOP;
            break;
          default:
            errors.push(`Line ${i+1}: Unknown opcode ${opStr}`);
        }
      } catch (e) {
        errors.push(`Line ${i+1}: Syntax error`);
      }
      instructions.push(inst);
    }

    return { instructions, errors };
  }
}
