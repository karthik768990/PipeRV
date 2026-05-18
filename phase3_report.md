# Phase 3 Report - Virtual Memory and Trace Replay Simulation

## Architecture Overview
The simulator has been extended to support virtual memory handling and trace replay mode. In trace replay mode, the CPU processes instructions in the order they are parsed from the input trace file, simulating a 5-stage pipeline with forwarding and data hazard detection. Memory instructions now traverse the Virtual Memory Manager (VMM) before accessing the L1 Cache.

## Virtual Memory Design
The Virtual Memory subsystem consists of the following components:
1. **Virtual Memory Manager (VMM)**: The main interface that orchestrates translation and accounts for latency.
2. **Data TLB (DTLB)**: Configurable number of entries simulating fast path translation. It supports both FIFO and LRU replacement policies.
3. **Page Table**: A flat page table utilizing a sparse hash map layout to simulate full 32-bit virtual address spaces without allocating unnecessary contiguous memory for unmapped pages. It stores the dirty, valid, and physical frame bits.
4. **Frame Manager**: Represents the finite physical memory. Frames are allocated on first touch (page fault). It uses either FIFO or LRU policies to select victims when physical memory is full.

## Page Fault Flow
When a memory instruction (L or S) attempts to execute:
1. **TLB Lookup**: The VMM looks up the VPN in the TLB. If there is a hit, the penalty is `tlb_hit_latency`. If it is a store operation, the dirty bit is set.
2. **Page Walk**: On a TLB miss, a page walk is simulated adding `page_walk_latency`. The page table is accessed. If valid, the mapping is loaded into the TLB.
3. **Page Fault**: If the page is invalid in the page table, a page fault occurs adding `page_fault_latency`. The Frame Manager allocates a new frame.
4. **Eviction**: If the physical memory is full during allocation, a victim frame is chosen. If the evicted page was marked as dirty in the page table, it's counted as a dirty eviction (simulating writeback to disk).

## Replacement Policy Implementation
We support both FIFO and LRU replacements. 
- **LRU** maintains a linked list of accesses. Upon any access (TLB hit or Page Table lookup), the frame/TLB entry is bumped to the back of the list. The front of the list is always chosen as the victim.
- **FIFO** pushes entries into the list on insertion. The front is popped on eviction, ignoring any intermittent accesses.

## Statistics Collected
- **Total Cycles**: Including all stalls due to hazards and memory operations.
- **Instructions Retired**: The total number of instructions committed in WB.
- **IPC**: Instructions Per Cycle.
- **Stalls**: Pipeline idle cycles.
- **TLB Hits / Misses**: Counts for translation fast-path.
- **Page Walks**: Counts for TLB misses accessing the page table.
- **Page Faults**: Counts for accessing unmapped pages.
- **Page Evictions**: Number of times physical memory was full and a frame was evicted.
- **Dirty Evictions / Writebacks**: Number of evictions where the page was dirty, necessitating writeback.
- **Translation Penalty Cycles**: Total accumulated cycles spent waiting for TLB hits, walks, and faults.

## Traces Executed & Observations
The simulator has been evaluated using trace files containing load, store, multiply, and add operations. The system dynamically scales based on input configurations. We observed higher dirty evictions with FIFO compared to LRU under memory pressure, and correctly penalized the execution cycles for cache and TLB misses, resulting in deterministically sound IPC outputs.
