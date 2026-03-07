#include "CPU.hpp"

    CPU::CPU(){
        pc = 0;
        memory.reset();
        stats.reset();
        registerFile.reset();
        pipeline.reset();
    }

    void CPU::loadProgram(const std::vector<Instruction>& instructions){
        this->instructions = instructions;
        pc = 0;
        pipeline.reset();
        stats.reset();
        registerFile.reset();
    }

    void CPU::reset(){
        pc = 0;
        registerFile.reset();
        memory.reset();
        pipeline.reset();
        stats.reset();
    }

    void CPU::run(){

    // Run until program finishes and pipeline drains
    while (pc < instructions.size() || pipeline.hasPendingInstructions()) {

        pipeline.step(instructions,
                      pc,
                      registerFile,
                      memory,
                      stats,
                      config);
    }
    }
