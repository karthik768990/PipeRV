#pragma once

class Stats{
    private:
        long long cycleCount;
        long long instructionCount;
        long long stallCount;
    public:
        Stats(){
            reset();
        }  
        void reset();
        void incrementCycle();
        void incrementInstruction();
        void incrementStall();
        long long getCycleCount() const;
        long long getStallCount() const;
        long long getInstructionCount() const;
        double calculateIPC() const;
    };