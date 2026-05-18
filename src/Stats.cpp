#include "Stats.hpp"

Stats::Stats() {
    reset();
}

void Stats::reset() {
    cycleCount = 0;
    instructionCount = 0;
    stallCount = 0;
    tlbHits = 0;
    tlbMisses = 0;
    pageWalks = 0;
    pageFaults = 0;
    pageEvictions = 0;
    dirtyEvictions = 0;
    translationPenaltyCycles = 0;
}

void Stats::incrementCycle(){
    cycleCount++;
}

void Stats::incrementInstruction(){
    instructionCount++;
}

void Stats::incrementStall(){
    stallCount++;
}

double Stats::calculateIPC() const{
    if(cycleCount==0)return 0.0;
    return 1.0*instructionCount/cycleCount;
}