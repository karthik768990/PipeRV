// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - Register File
// 32 RISC-V integer registers, x0 hardwired to 0
// ═══════════════════════════════════════════════════════════════════════

export class RegisterFile {
  private regs: Int32Array;
  private prevRegs: Int32Array; // Track previous values for change detection
  static readonly NUM_REGS = 32;

  constructor() {
    this.regs = new Int32Array(RegisterFile.NUM_REGS);
    this.prevRegs = new Int32Array(RegisterFile.NUM_REGS);
  }

  read(index: number): number {
    if (index < 0 || index >= RegisterFile.NUM_REGS) {
      throw new RangeError(`Register index ${index} out of range [0, ${RegisterFile.NUM_REGS - 1}]`);
    }
    return this.regs[index];
  }

  write(index: number, value: number): void {
    if (index <= 0 || index >= RegisterFile.NUM_REGS) return; // x0 is always 0
    this.regs[index] = value | 0; // Ensure 32-bit integer
  }

  /** Save current state as "previous" for change detection */
  savePrevious(): void {
    this.prevRegs.set(this.regs);
  }

  /** Check if a register changed since last savePrevious() */
  hasChanged(index: number): boolean {
    return this.regs[index] !== this.prevRegs[index];
  }

  /** Get all changed register indices */
  getChangedRegisters(): number[] {
    const changed: number[] = [];
    for (let i = 0; i < RegisterFile.NUM_REGS; i++) {
      if (this.regs[i] !== this.prevRegs[i]) changed.push(i);
    }
    return changed;
  }

  /** Get all register values as a plain array */
  getAll(): number[] {
    return Array.from(this.regs);
  }

  /** Set a register value directly (for debug editing) */
  setDirect(index: number, value: number): void {
    if (index <= 0 || index >= RegisterFile.NUM_REGS) return;
    this.regs[index] = value | 0;
  }

  reset(): void {
    this.regs.fill(0);
    this.prevRegs.fill(0);
  }

  clone(): RegisterFile {
    const rf = new RegisterFile();
    rf.regs.set(this.regs);
    rf.prevRegs.set(this.prevRegs);
    return rf;
  }
}
