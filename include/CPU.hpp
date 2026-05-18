#pragma once

#include <vector>
#include "Instruction.hpp"
#include "RegisterFile.hpp"
#include "Memory.hpp"
#include "Stats.hpp"
#include "ConfigReader.hpp"
#include "Pipeline.hpp"
#include "vm/virtual_memory_manager.hpp"

class CPU{
private:
    Cache* L1I = nullptr;
    Cache* L1D = nullptr;
    Cache* L2 = nullptr;
    VirtualMemoryManager* vmm = nullptr;

    std::vector<Instruction> instructions;

    int pc;   // instruction index (not byte address)

    RegisterFile registerFile;
    Memory memory;
    Stats stats;
    ConfigReader config;

    Pipeline pipeline;   // pipeline execution engine

public:
    CPU();
    ~CPU();
    void loadProgram(const std::vector<Instruction>& instructions);

    void run();
    void step();

    void reset();
    void dumpMemory(int start, int end) const;
    void setConfig(const ConfigReader& config);
    const Stats& getStats() const { return stats; }

    const Pipeline& getPipeline() const { return pipeline; }
    const RegisterFile& getRegisterFile() const { return registerFile; }
    int getPC() const { return pc; }
    const Memory& getMemory() const { return memory; }
};