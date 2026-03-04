#include "Stats.hpp"
#include <assert.h>

void Stats::incrementCycle(){
    Stats::cycleCount++;
}

void Stats::incrementInstruction(){
    Stats::instructionCount++;
}

void Stats::incrementStall(){
    Stats::stallCount++;
}

long long Stats::getCycleCount() const{
    return Stats::cycleCount;
}

long long Stats::getInstructionCount() const{
    return Stats::instructionCount;
}

long long Stats::getStallCount() const{
    return Stats::stallCount;
}

double Stats::calculateIPC() const{
    return 1.0*Stats::instructionCount/Stats::cycleCount;
}
