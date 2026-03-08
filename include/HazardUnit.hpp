#pragma once

struct IF_ID;
struct ID_EX;
struct EX_MEM;
struct MEM_WB;



class HazardUnit{
public:

    bool shouldStall(const IF_ID& if_id,
                     const ID_EX& id_ex);

    bool shouldFlush(bool branchTaken);
};