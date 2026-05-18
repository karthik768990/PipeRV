#pragma once

class Stats {
private:
    long long cycleCount;
    long long instructionCount;
    long long stallCount;
    
    // Phase 3 VM Stats
    long long tlbHits;
    long long tlbMisses;
    long long pageWalks;
    long long pageFaults;
    long long pageEvictions;
    long long dirtyEvictions;
    long long translationPenaltyCycles;

public:
    Stats();
    void reset();
    void incrementCycle();
    void incrementInstruction();
    void incrementStall();
    
    void incrementTLBHits() { tlbHits++; }
    void incrementTLBMisses() { tlbMisses++; }
    void incrementPageWalks() { pageWalks++; }
    void incrementPageFaults() { pageFaults++; }
    void incrementPageEvictions() { pageEvictions++; }
    void incrementDirtyEvictions() { dirtyEvictions++; }
    void addTranslationPenalty(long long penalty) { translationPenaltyCycles += penalty; }

    long long getCycleCount() const { return cycleCount; }
    long long getInstructionCount() const { return instructionCount; }
    long long getStallCount() const { return stallCount; }
    
    long long getTLBHits() const { return tlbHits; }
    long long getTLBMisses() const { return tlbMisses; }
    long long getPageWalks() const { return pageWalks; }
    long long getPageFaults() const { return pageFaults; }
    long long getPageEvictions() const { return pageEvictions; }
    long long getDirtyEvictions() const { return dirtyEvictions; }
    long long getTranslationPenaltyCycles() const { return translationPenaltyCycles; }

    double calculateIPC() const;
};