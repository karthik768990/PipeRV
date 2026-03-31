// for the memory being not byte addressable for the phase -1 
#pragma once 

class Memory{
    static constexpr int mem_size = 1024;
    private:
        int mem[mem_size];
    public:    
        Memory(){
                reset();
        }
        int load(int address) const;
        void store(int address,int value);
        void reset();
        void dumpMemory(int start, int end) const;
    };