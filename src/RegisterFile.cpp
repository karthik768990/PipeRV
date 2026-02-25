#include "RegisterFile.hpp"
#include <stdexcept>

RegisterFile::RegisterFile(){
    reset();
}

int RegisterFile::read(int index) const{
    if(index<0 || index>= RegisterFile::NUM_REGS)
         throw std::out_of_range("Register index out of range");
    else return regs[index]; 
}

void RegisterFile::write(int index,int value){

    if(index<=0 || index>=RegisterFile::NUM_REGS)return;
    else regs[index] =value;
}
void RegisterFile::reset(){
    for(int i=0;i<RegisterFile::NUM_REGS;i++){
        regs[i]=0;
    }
}