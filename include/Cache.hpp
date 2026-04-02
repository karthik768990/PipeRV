#pragma once
#include <vector>


// Cache organized as: sets × associativity



struct CacheLine{
    bool valid;
    int tag;

    int lastUsedTime; //this is for the lru policy 
    int insertionTime; //this is for the fifo policy
};

enum class ReplacementPolicy{
    FIFO,LRU
}; // to avoid the string comparisions and have a cleaner implementation in cpp 


class Cache{
    private:
        int numBlocks;
        int size;
        int blockSize;
        int associativity;
        int latency;

        int numSets;
        int globalTime;

        std::vector<std::vector<CacheLine>> sets;

        ReplacementPolicy policy;

    public:
        Cache* nextLevel = nullptr;
        int memLatency = 50;
        int hits = 0;
        int misses = 0;

    Cache(int size,int blockSize, int associativity,int latency,ReplacementPolicy policy){
            this->associativity  = associativity;
            this->size = size;
            this->blockSize = blockSize;
            this->latency = latency;
            this->policy = policy;
            this->numBlocks = size/blockSize;
            this->numSets = numBlocks/associativity;

            sets.resize(numSets, std::vector<CacheLine>(associativity));

                    // Initialize each cache line
            for (int i = 0; i < numSets; i++) {
                for (int j = 0; j < associativity; j++) {
                    sets[i][j].valid = false;
                    sets[i][j].tag = -1;
                    sets[i][j].lastUsedTime = 0;
                    sets[i][j].insertionTime = 0;
                    }
                }

                globalTime = 0;
                
            }

        int access(int address);
        int getLatency(bool hit);
    private:
        int getIndex(int address) const;
        int getTag(int address) const ;
        void replaceLine(int setIndex,int tag) ;

};