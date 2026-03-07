#pragma once
#include "Pipeline.hpp"

class HazardUnit{
public:

    bool shouldStall(const IF_ID& if_id,
                     const ID_EX& id_ex);

    bool shouldFlush(bool branchTaken);
};