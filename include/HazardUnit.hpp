#pragma once
#include "Pipeline.hpp"

class HazardUnit{
    public:
        bool shouldStall(const ID_EX& id_ex,
                 const EX_MEM& ex_mem,
                 const MEM_WB& mem_wb,
                 bool forwardingEnabled);
        bool shouldFlush(bool isBranchTaken);
    };