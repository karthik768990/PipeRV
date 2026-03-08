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

# Project Structure

```
PipeRV-main
│
├── config/
│   └── config.txt
│
├── include/
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
Mohammed Owais, Karthikeya T 

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
- Karthikeya Tamarapalli 

---

# License

This project is developed as part of the **CS209P Computer Architecture course project at IIT Tirupati**.

The code is intended for **academic purposes** and follows the project guidelines provided by the course instructors.

---


