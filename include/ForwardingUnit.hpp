#pragma once
#include "Pipeline.hpp"

class ForwardingUnit{
    public:
        void resolveForwarding(const ID_EX& id_ex,const EX_MEM& ex_mem,const MEM_WB& mem_wb,int& operand1,int& operand2);  
};