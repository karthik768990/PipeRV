#pragma once
#include <vector>
#include "Instruction.hpp"
#include "RegisterFile.hpp"
#include "Memory.hpp"
#include "Stats.hpp"
#include "ConfigReader.hpp"
#include "ForwardingUnit.hpp"
#include "HazardUnit.hpp"



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


class Pipeline {
private:


    ForwardingUnit forwardingUnit;
    HazardUnit hazardUnit;
    IF_ID if_id;
    ID_EX id_ex;
    EX_MEM ex_mem;
    MEM_WB mem_wb;


    bool stall;
    bool flush;

public:
    Pipeline();

    void reset();

    void step(std::vector<Instruction>& instructions,
              int& pc,
              RegisterFile& registerFile,
              Memory& memory,
              Stats& stats,
              ConfigReader& config);
    
    bool hasPendingInstructions() const;          
    
};