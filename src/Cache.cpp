#include "Cache.hpp"
#include <vector>

int Cache::getIndex(int address) const{
    int blockAddr = address/blockSize;
    return blockAddr%numSets;
}

int Cache::getTag(int address) const{
    int blockAddr = address/blockSize;
    return blockAddr/numSets;
}

int Cache::access(int address){
    globalTime++;
    int index = getIndex(address);
    int tag = getTag(address);

    // 1. Check Hit
    for(CacheLine& line : sets[index]){
        if(line.valid && line.tag == tag){
            line.lastUsedTime = globalTime;
            hits++;
            return this->latency; // Return base latency on hit
        }
    } 

    // 2. Handle Miss
    misses++;
    replaceLine(index, tag);

    // 3. Ask downstream and accumulate latency
    int downstreamLatency = 0;
    if (nextLevel != nullptr) {
        downstreamLatency = nextLevel->access(address);
    } else {
        downstreamLatency = memLatency;
    }

    return this->latency + downstreamLatency;
}
//replacement logic first in first out for now 
void Cache::replaceLine(int setIndex,int tag){
    for(int i=0;i<associativity;i++){
        if(!sets[setIndex][i].valid){
            sets[setIndex][i].valid = true;
            sets[setIndex][i].tag  = tag;
            sets[setIndex][i].insertionTime = globalTime;
            sets[setIndex][i].lastUsedTime = globalTime;
            return;
        }
    }
    int victimIndex = 0;
    if(policy == ReplacementPolicy::FIFO){
        int minTime = sets[setIndex][0].insertionTime;

        for(int i=1;i<associativity;i++){
            if(sets[setIndex][i].insertionTime<minTime){
                minTime = sets[setIndex][i].insertionTime;
                victimIndex = i;
            }
        }
    }
    else if(policy == ReplacementPolicy::LRU){

        int minTime = sets[setIndex][0].lastUsedTime;

        for(int i=1;i<associativity;i++){
            if(sets[setIndex][i].lastUsedTime<minTime){
                minTime = sets[setIndex][i].lastUsedTime;
                victimIndex = i;
            }
        }
    }

    sets[setIndex][victimIndex].tag = tag;
    sets[setIndex][victimIndex].valid = true;
    sets[setIndex][victimIndex].insertionTime = globalTime;
    sets[setIndex][victimIndex].lastUsedTime = globalTime;
}
