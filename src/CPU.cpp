#include "../include/CPU.hpp"

    CPU::CPU(){
        pc = 0;
        memory.reset();
        stats.reset();
        registerFile.reset();
        pipeline.reset();
       
    }
    CPU::~CPU() {
    delete L1I;
    delete L1D;
    delete L2;
    delete vmm;

    L1I = nullptr;
    L1D = nullptr;
    L2 = nullptr;
    vmm = nullptr;
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
        while (pc < instructions.size() || pipeline.hasPendingInstructions()) {
            step();
        }
    }

    void CPU::step(){
        if (pc < instructions.size() || pipeline.hasPendingInstructions()) {
            pipeline.step(instructions,
                          pc,
                          registerFile,
                          memory, *L1I,*L1D,
                          stats,
                          config,
                          vmm);
        }
    }

    void CPU::dumpMemory(int start, int end) const {
        memory.dumpMemory(start, end);
    }
    void CPU::setConfig(const ConfigReader& config) {
    this->config = config;
    memory.resize(config.getPhysicalSizeBytes());
    delete L1I; delete L1D; delete L2;
    L1I = new Cache(config.getL1Size(), config.getL1BlockSize(), config.getL1Assoc(), config.getL1Latency(), ReplacementPolicy::LRU);
    L1D = new Cache(config.getL1Size(), config.getL1BlockSize(), config.getL1Assoc(), config.getL1Latency(), ReplacementPolicy::LRU);
    L2 = new Cache(config.getL2Size(), config.getL2BlockSize(), config.getL2Assoc(), config.getL2Latency(), ReplacementPolicy::LRU);

    L1I->nextLevel = L2;
    L1D->nextLevel = L2;

    L2->nextLevel = nullptr;
    L2->memLatency = config.getMemLatency();
    
    delete vmm;
    vmm = new VirtualMemoryManager(config, &stats);
}