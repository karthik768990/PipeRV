// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - Memory
// Word-addressable memory with change tracking
// ═══════════════════════════════════════════════════════════════════════

export class Memory {
  private mem: Int32Array;
  private modifiedAddresses: Set<number>; // Track recently modified addresses

  constructor(sizeBytes: number = 16384) {
    this.mem = new Int32Array(sizeBytes / 4);
    this.modifiedAddresses = new Set();
  }

  load(address: number): number {
    if (address < 0) throw new Error(`Invalid memory address: ${address}`);
    if (address % 4 !== 0) throw new Error(`Misaligned memory access at address: 0x${address.toString(16)}`);
    const index = address >>> 2;
    if (index >= this.mem.length) throw new Error(`Memory address out of bounds: 0x${address.toString(16)}`);
    return this.mem[index];
  }

  store(address: number, value: number): void {
    if (address < 0) throw new Error(`Invalid memory address: ${address}`);
    if (address % 4 !== 0) throw new Error(`Misaligned memory access at address: 0x${address.toString(16)}`);
    const index = address >>> 2;
    if (index >= this.mem.length) throw new Error(`Memory address out of bounds: 0x${address.toString(16)}`);
    this.mem[index] = value | 0;
    this.modifiedAddresses.add(address);
  }

  /** Get all recently modified addresses and clear the set */
  getAndClearModified(): number[] {
    const modified = Array.from(this.modifiedAddresses);
    this.modifiedAddresses.clear();
    return modified;
  }

  /** Get non-zero memory entries (for efficient snapshot) */
  getNonZeroEntries(): Map<number, number> {
    const entries = new Map<number, number>();
    for (let i = 0; i < this.mem.length; i++) {
      if (this.mem[i] !== 0) {
        entries.set(i * 4, this.mem[i]);
      }
    }
    return entries;
  }

  /** Get a range of memory for display */
  getRange(startAddr: number, count: number): { address: number; value: number }[] {
    const result: { address: number; value: number }[] = [];
    const startIndex = Math.max(0, (startAddr >>> 2));
    const endIndex = Math.min(this.mem.length, startIndex + count);
    for (let i = startIndex; i < endIndex; i++) {
      result.push({ address: i * 4, value: this.mem[i] });
    }
    return result;
  }

  /** Check if an address was recently modified */
  isModified(address: number): boolean {
    return this.modifiedAddresses.has(address);
  }

  /** Get total memory size in bytes */
  get sizeBytes(): number {
    return this.mem.length * 4;
  }

  /** Get total memory size in words */
  get sizeWords(): number {
    return this.mem.length;
  }

  resize(sizeBytes: number): void {
    this.mem = new Int32Array(sizeBytes / 4);
    this.modifiedAddresses.clear();
  }

  reset(): void {
    this.mem.fill(0);
    this.modifiedAddresses.clear();
  }

  /** Direct access for debug editing */
  setDirect(address: number, value: number): void {
    if (address < 0 || address % 4 !== 0) return;
    const index = address >>> 2;
    if (index < this.mem.length) {
      this.mem[index] = value | 0;
      this.modifiedAddresses.add(address);
    }
  }
}
