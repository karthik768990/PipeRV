# PipeRV – RISC-V Pipeline Simulator

## Overview

PipeRV is a **RISC-V instruction set simulator** developed as part of the **CS209P Computer Architecture course project**.

The objective of this project is to design and implement a simulator similar to **Ripes**, capable of executing a subset of the **RISC-V ISA** while modelling a pipelined processor architecture.

The simulator reads a RISC-V assembly program, executes it through a **5-stage pipeline**, and reports performance metrics such as **pipeline stalls** and **IPC (Instructions Per Cycle)**.

The simulator is implemented in **C++** and maintained using **Git on GitHub**.

---

# Features Implemented (Phase-1)

## 1. RISC-V Instruction Support

The simulator currently supports the following instructions:

### Arithmetic
- ADD  
- SUB  

### Control Flow
- BNE  
- JAL  

### Memory Operations
- LW  
- SW  

Additional instructions can be added easily through the instruction parser.

---

## 2. 5-Stage Pipeline Architecture

The processor pipeline consists of the following stages:

| Stage | Description |
|------|-------------|
| IF | Instruction Fetch |
| ID | Instruction Decode / Register Fetch |
| EX | Execute |
| MEM | Memory Access |
| WB | Write Back |

Pipeline registers are maintained between each stage to simulate realistic processor behavior.

---

## 3. Data Hazard Handling

The simulator includes mechanisms to handle **data hazards**:

- Forwarding Unit  
- Hazard Detection Unit  
- Pipeline stalls when required  

Forwarding can be **enabled or disabled through the configuration file**.

---

## 4. Configurable Instruction Latencies

Instruction execution latencies are **not hardcoded**.

Instead, they are read from a **configuration file**, allowing users to experiment with different processor designs.

Example:

```
ADD latency = 1
MUL latency = 3
```

This allows flexible pipeline simulation.

---

## 5. Memory Simulation

The simulator provides:

- At least **4KB of memory**
- **Load and store operations**
- **Instruction input from assembly files**

The assembly program itself is **read directly from the file rather than stored in memory**.

---

## 6. Assembly Program Execution

The simulator parses assembly files such as:

```
add x1, x2, x3
sub x4, x1, x5
bne x4, x0, LABEL
sw x4, 0(x3)
jal x0, LABEL
```

Features supported:

- Labels
- Comments

Example programs included:

- Sample programs
- Bubble sort implementation

---

## 7. Performance Metrics

At the end of execution, the simulator reports:

- Total cycles
- Total instructions executed
- Number of pipeline stalls
- IPC (Instructions Per Cycle)

These metrics help analyze processor performance.

---

## 8. Virtual Memory Subsystem (Phase-3)

The simulator implements a comprehensive Virtual Memory Manager (VMM) supporting:
- **Trace Replay Execution**: Direct simulation of execution traces containing `L`, `S`, `ADD`, and `MUL` instructions.
- **Data TLB (DTLB)**: Fast-path translation with configurable latencies and hit/miss tracking.
- **Flat Page Table**: 32-bit virtual addressing mapped dynamically to simulate full address spaces.
- **Frame Manager**: Enforces strict finite physical memory constraints dynamically allocating physical frames.
- **Page Replacements**: Evicts pages using FIFO or LRU policies when memory is full, logging dirty write-back penalties.
- **Pipeline Freezing**: Aggregates translation latency overhead correctly to stall pipeline execution deterministically.

---

# Project Structure

```
PipeRV-main
│
├── config/
│   └── config.txt
│
├── include/
│   ├── vm/
│   │   ├── frame_manager.hpp
│   │   ├── page_table.hpp
│   │   ├── tlb.hpp
│   │   └── virtual_memory_manager.hpp
│   ├── CPU.hpp
│   ├── ConfigReader.hpp
│   ├── ForwardingUnit.hpp
│   ├── HazardUnit.hpp
│   ├── Instruction.hpp
│   ├── Memory.hpp
│   ├── Parser.hpp
│   ├── Pipeline.hpp
│   ├── RegisterFile.hpp
│   └── Stats.hpp
│
├── src/
│   ├── vm/
│   │   ├── frame_manager.cpp
│   │   ├── page_table.cpp
│   │   ├── tlb.cpp
│   │   └── virtual_memory_manager.cpp
│   ├── CPU.cpp
│   ├── ConfigReader.cpp
│   ├── ForwardingUnit.cpp
│   ├── HazardUnit.cpp
│   ├── Instruction.cpp
│   ├── Memory.cpp
│   ├── Parser.cpp
│   ├── Pipeline.cpp
│   ├── RegisterFile.cpp
│   ├── Stats.cpp
│   └── main.cpp
│
├── input/
│   ├── bubble_sort.asm
│   └── sample.asm
│
├── CMakeLists.txt
├── README.md
└── .gitignore
```

---

# Design Decisions

1. The simulator was implemented using **C++ for performance and modular design**.

2. The architecture was divided into independent modules such as:
   - Instruction parser  
   - CPU controller  
   - Pipeline stages  
   - Memory  
   - Register file  
   - Hazard detection  
   - Forwarding unit  

3. Instruction latencies and forwarding behavior are controlled through a **configuration file**, allowing experimentation without modifying the code.

4. Pipeline components were implemented as **separate classes** to improve maintainability.

---

# Meeting Minutes

## Meeting – 28 Feb 2026

**Members:**  
Mohammed Owais, Karthik T 

### Decisions
- Finalized simulator architecture  
- Implemented pipeline stages  
- Added hazard detection and forwarding logic  
- Integrated configuration file support  

### Tasks
- Test simulator with bubble sort  
- Verify stall count and IPC calculations  

---

## Meeting – 24 Feb 2026

**Members:**  
Mohammed Owais, Karthik Tamarapalli    

### Decisions
- Designed the overall simulator structure  
- Assigned implementation modules:
  - Instruction parsing  
  - Memory system  
  - Register file  
  - Pipeline controller  

### Tasks
- Begin implementation of pipeline stages  
- Define configuration file format  

---

# Contributors

- Mohammed Owais  
- Karthik Tamarapalli 

---

# Running of the simulator can be done by the following ways 
## Compiling the simulator 
   - Compile the simulator using the following command
     ```bash
      g++ -std=c++17 src/*.cpp src/vm/*.cpp -Iinclude -o simulator
     ```
     *(Note: If compiling under Windows PowerShell, you can use: `g++ -std=c++17 src/CPU.cpp src/Cache.cpp src/ConfigReader.cpp src/ForwardingUnit.cpp src/HazardUnit.cpp src/Memory.cpp src/Parser.cpp src/Pipeline.cpp src/RegisterFile.cpp src/Stats.cpp src/main.cpp src/vm/frame_manager.cpp src/vm/page_table.cpp src/vm/tlb.cpp src/vm/virtual_memory_manager.cpp -Iinclude -o simulator`)*

## Running the simulator 
   - Run the phase-1 standard assembly simulation:
      ```bash
               ./simulator input/config.txt input/bubble_sort.asm
      ```
   - Run the phase-3 trace replay virtual memory simulation:
      ```bash
               ./simulator vm_config.txt test.trace
      ```
# License

This project is developed as part of the **CS209P Computer Architecture course project at IIT Tirupati**.

The code is intended for **academic purposes** and follows the project guidelines provided by the course instructors.

---



