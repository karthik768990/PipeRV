#pragma once
#include "Pipeline.hpp"
struct ID_EX;
struct EX_MEM;
struct MEM_WB;
struct IF_ID;
class HazardUnit{
public:

    bool shouldStall(const IF_ID& if_id,
                     const ID_EX& id_ex);

    bool shouldFlush(bool branchTaken);
};