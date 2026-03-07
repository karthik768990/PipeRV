#include "HazardUnit.hpp"

bool HazardUnit::shouldStall(const ID_EX& id_ex,
                             const EX_MEM& ex_mem,
                             const MEM_WB& mem_wb,
                             bool forwardingEnabled) {

    return false;
}

bool HazardUnit::shouldFlush(bool isBranchTaken) {
    return false;
}