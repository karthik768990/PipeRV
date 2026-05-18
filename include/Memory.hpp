#pragma once 
#include <vector>

class Memory{
    private:
        std::vector<int> mem;
    public:    
        Memory(int size_bytes = 16384){
            mem.resize(size_bytes / 4, 0);
        }
        void resize(int size_bytes) {
            mem.assign(size_bytes / 4, 0);
        }
        int load(int address) const;
        void store(int address,int value);
        void reset();
        void dumpMemory(int start, int end) const;
};