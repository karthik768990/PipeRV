#pragma once
#include <vector>
#include "Instruction.hpp"
#include "RegisterFile.hpp"
#include "Memory.hpp"
#include "Stats.hpp"
#include "ConfigReader.hpp"
#include "ForwardingUnit.hpp"
#include "HazardUnit.hpp"
#include  "Cache.hpp"


struct IF_ID {
        Instruction instruction;
        int pc;
    };

    struct ID_EX {
        Instruction instruction;
        int pc;
        int operand1;
        int operand2;
    };

    struct EX_MEM {
        Instruction instruction;
        int aluResult;
        int operand2;   // Needed for SW
    };

    struct MEM_WB {
        Instruction instruction;
        int writeData;
    };

class VirtualMemoryManager;

class Pipeline {
private:

    Cache* L1D;
int mem_stall_cycles;
    int if_stall_cycles;
    int current_pa;
    ForwardingUnit forwardingUnit;
    bool mem_access_in_progress;
    HazardUnit hazardUnit;
    IF_ID if_id;
    ID_EX id_ex;
    EX_MEM ex_mem;
    MEM_WB mem_wb;
    int ex_cycles_remaining = 0;

    bool stall;
    bool flush;

public:
    Pipeline();

    void reset();

    void step(std::vector<Instruction>& instructions,
              int& pc,
              RegisterFile& registerFile,
              Memory& memory, Cache& L1I,Cache& L1D,
              Stats& stats,
              ConfigReader& config,
              VirtualMemoryManager* vmm);
    
    bool hasPendingInstructions() const;          
    
    const IF_ID& getIfId() const { return if_id; }
    const ID_EX& getIdEx() const { return id_ex; }
    const EX_MEM& getExMem() const { return ex_mem; }
    const MEM_WB& getMemWb() const { return mem_wb; }
    int getMemStallCycles() const { return mem_stall_cycles; }
};