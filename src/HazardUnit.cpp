#include "HazardUnit.hpp"
#include "Pipeline.hpp"

bool HazardUnit::shouldStall(const IF_ID& if_id,
                             const ID_EX& id_ex)
{
    const Instruction& exInst = id_ex.instruction;
    const Instruction& idInst = if_id.instruction;

    // Only care about load-use hazard
    if (exInst.opcode == OPCODE::LW) {

        int loadDest = exInst.rd;

        if (loadDest >= 0) {

            if (loadDest == idInst.rs1 ||
                loadDest == idInst.rs2) {

                return true;
            }
        }
    }

    return false;
}

bool HazardUnit::shouldFlush(bool branchTaken)
{
    return branchTaken;
}