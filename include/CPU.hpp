#pragma once
#include <vector>
#include "Instruction.hpp"
#include "RegisterFile.hpp"
#include "Memory.hpp"
#include "Stats.hpp"
#include "ConfigReader.hpp"



class CPU{
    private:
        std::vector<Instruction> instructions;
        int pc; //here the pc represents the instruction index in this simulator  not the byte address like the usual architecture
        RegisterFile registerFile;
        Memory memory;
        Stats stats;
        ConfigReader config;   // TODO add the pipeline later and for now make this working 
    public:
        CPU();
        void loadProgram(const std::vector<Instruction>& instructions);
        void run();
        void reset();    
};