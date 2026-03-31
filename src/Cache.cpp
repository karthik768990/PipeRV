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

bool Cache::access(int address){
    globalTime++;
    int index = getIndex(address);
    int tag = getTag(address);

    // for each line in sets[index]
    //  if line.valid && line.tag==tag:

    for( CacheLine& line : sets[index]){
        if(line.valid && line.tag==tag){
            //this indicates a hit 
            line.lastUsedTime = globalTime;
            return true;
        }

    } 
    replaceLine(index,tag);
    return false;
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
