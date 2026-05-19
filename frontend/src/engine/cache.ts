// ═══════════════════════════════════════════════════════════════════════
// PipeRV Simulation Engine - Cache Simulator
// Set-associative cache with LRU replacement policy
// ═══════════════════════════════════════════════════════════════════════

export class CacheLine {
  valid: boolean = false;
  tag: number = 0;
  lastUsedCycle: number = 0;
}

export class Cache {
  size: number; // in bytes
  blockSize: number; // in bytes
  assoc: number; // associativity (1 = direct-mapped, etc.)
  latency: number; // hit latency in cycles
  numSets: number;
  sets: CacheLine[][];

  // Statistics
  hits: number = 0;
  misses: number = 0;

  constructor(size: number, blockSize: number, assoc: number, latency: number) {
    this.size = size;
    this.blockSize = blockSize;
    this.assoc = assoc;
    this.latency = latency;

    // Number of sets = size / (blockSize * assoc)
    this.numSets = Math.max(1, Math.floor(size / (blockSize * assoc)));
    this.sets = Array.from({ length: this.numSets }, () =>
      Array.from({ length: this.assoc }, () => new CacheLine())
    );
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
    for (let s = 0; s < this.numSets; s++) {
      for (let a = 0; a < this.assoc; a++) {
        this.sets[s][a].valid = false;
        this.sets[s][a].tag = 0;
        this.sets[s][a].lastUsedCycle = 0;
      }
    }
  }

  /**
   * Access the cache at a byte address.
   * Returns true on hit, false on miss.
   */
  access(address: number, currentCycle: number): boolean {
    const blockAddress = Math.floor(address / this.blockSize);
    const setIndex = blockAddress % this.numSets;
    const tag = Math.floor(blockAddress / this.numSets);

    const set = this.sets[setIndex];

    // Check if the block is already in the cache set
    for (let i = 0; i < set.length; i++) {
      const line = set[i];
      if (line.valid && line.tag === tag) {
        line.lastUsedCycle = currentCycle;
        this.hits++;
        return true; // Cache Hit
      }
    }

    // Cache Miss
    this.misses++;

    // Find replacement line (LRU policy)
    let replaceIndex = 0;
    let minCycle = Infinity;
    let foundInvalid = false;

    for (let i = 0; i < set.length; i++) {
      const line = set[i];
      if (!line.valid) {
        replaceIndex = i;
        foundInvalid = true;
        break; // Empty slot found, use it immediately
      }
      if (line.lastUsedCycle < minCycle) {
        minCycle = line.lastUsedCycle;
        replaceIndex = i;
      }
    }

    // Place block into the cache set
    set[replaceIndex].valid = true;
    set[replaceIndex].tag = tag;
    set[replaceIndex].lastUsedCycle = currentCycle;

    return false; // Cache Miss
  }
}
