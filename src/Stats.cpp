#include "Stats.hpp"

void Stats::incrementCycle(){
    cycleCount++;
}

void Stats::incrementInstruction(){
    instructionCount++;
}

void Stats::incrementStall(){
    stallCount++;
}

long long Stats::getCycleCount() const{
    return cycleCount;
}

long long Stats::getInstructionCount() const{
    return instructionCount;
}

long long Stats::getStallCount() const{
    return stallCount;
}

double Stats::calculateIPC() const{
    if(cycleCount==0)return 0.0;
    return 1.0*instructionCount/cycleCount;
}
