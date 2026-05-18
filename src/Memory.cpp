#include <assert.h>
#include "Memory.hpp"
#include <iostream>
int Memory::load(int address) const{
    assert(address >= 0);
if(address % 4 != 0){
    std::cout << "INVALID ADDRESS ACCESS: " << address << std::endl;
}
    assert(address % 4 == 0);
    assert(address < mem.size() * 4);

    int index = address / 4;
    return mem[index];
}

void Memory::store(int address,int value){
    assert(address >= 0);
    assert(address % 4 == 0);
    assert(address < mem.size() * 4);

    int index = address / 4;
    mem[index] = value;
}

void Memory::reset(){
    for(size_t i=0;i<mem.size();i++){
        mem[i]=0;
    }
}
void Memory::dumpMemory(int start, int end) const{

    for(int addr = start; addr <= end; addr += 4){
        std::cout << "mem[" << addr << "] = " << load(addr) << std::endl;
    }

}