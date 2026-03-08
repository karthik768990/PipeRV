#pragma once

#include <vector>
#include "Instruction.hpp"
#include "RegisterFile.hpp"
#include "Memory.hpp"
#include "Stats.hpp"
#include "ConfigReader.hpp"
#include "Pipeline.hpp"

class CPU{
private:
    std::vector<Instruction> instructions;

    int pc;   // instruction index (not byte address)

    RegisterFile registerFile;
    Memory memory;
    Stats stats;
    ConfigReader config;

    Pipeline pipeline;   // pipeline execution engine

public:
    CPU();

    void loadProgram(const std::vector<Instruction>& instructions);

    void run();

    void reset();
    void dumpMemory(int start, int end) const;
    const Stats& getStats() const { return stats; }
};