#include "CPU.hpp"

    CPU::CPU(){
        pc = 0;
        memory.reset();
        stats.reset();
        registerFile.reset();
        pipeline.reset();
       
    }
    CPU::~CPU() {
    // Free dynamically allocated caches
    delete L1I;
    delete L1D;
    delete L2;

    // Optional but good practice: prevent dangling pointers
    L1I = nullptr;
    L1D = nullptr;
    L2 = nullptr;
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

    // Runing the cpu until program finishes and pipeline drains
    while (pc < instructions.size() || pipeline.hasPendingInstructions()) {

        pipeline.step(instructions,
                      pc,
                      registerFile,
                      memory, *L1I,*L1D,
                      stats,
                      config);
    }
    }

    void CPU::dumpMemory(int start, int end) const {
        memory.dumpMemory(start, end);
    }
    void CPU::setConfig(const ConfigReader& config) {
    this->config = config;
    delete L1I; delete L1D; delete L2;
    // 1. Allocate caches on the heap
    L1I = new Cache(config.getL1Size(), config.getL1BlockSize(), config.getL1Assoc(), config.getL1Latency(), ReplacementPolicy::LRU);
    L1D = new Cache(config.getL1Size(), config.getL1BlockSize(), config.getL1Assoc(), config.getL1Latency(), ReplacementPolicy::LRU);
    L2 = new Cache(config.getL2Size(), config.getL2BlockSize(), config.getL2Assoc(), config.getL2Latency(), ReplacementPolicy::LRU);

    // 2. Wire the hierarchy
    L1I->nextLevel = L2;
    L1D->nextLevel = L2;

    // 3. Set main memory latency fallback for L2
    L2->nextLevel = nullptr;
    L2->memLatency = config.getMemLatency();
}