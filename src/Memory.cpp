#include <assert.h>
#include "Memory.hpp"

int Memory::load(int address) const{
    assert(address >= 0);
    assert(address % 4 == 0);
    assert(address < mem_size * 4);

    int index = address / 4;
    return mem[index];
}

void Memory::store(int address,int value){
    assert(address >= 0);
    assert(address % 4 == 0);
    assert(address < mem_size * 4);

    int index = address / 4;
    mem[index] = value;
}

void Memory::reset(){
    for(int i=0;i<Memory::mem_size;i++){
        mem[i]=0;
    }
}