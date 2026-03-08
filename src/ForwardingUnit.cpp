#include "ForwardingUnit.hpp"
#include "Pipeline.hpp"

void ForwardingUnit::resolveForwarding(const ID_EX& id_ex,
                                       const EX_MEM& ex_mem,
                                       const MEM_WB& mem_wb,
                                       int& operand1,
                                       int& operand2)
{
    int rs1 = id_ex.instruction.rs1;
    int rs2 = id_ex.instruction.rs2;

    // ---------- Forward for operand1 ----------
    if (rs1 >= 0) {

        if (ex_mem.instruction.rd == rs1 &&
            ex_mem.instruction.rd > 0 &&
            ex_mem.instruction.opcode != OPCODE::SW &&
            ex_mem.instruction.opcode != OPCODE::LW &&
            ex_mem.instruction.opcode != OPCODE::BNE &&
            ex_mem.instruction.opcode != OPCODE::BLT &&
            ex_mem.instruction.opcode != OPCODE::BGE &&
            ex_mem.instruction.opcode != OPCODE::NOP) {

            operand1 = ex_mem.aluResult;
        }

        else if (mem_wb.instruction.rd == rs1 &&
                 mem_wb.instruction.rd > 0 &&
                 mem_wb.instruction.opcode != OPCODE::SW &&
                 mem_wb.instruction.opcode != OPCODE::BNE &&
                 mem_wb.instruction.opcode != OPCODE::BLT &&
                 mem_wb.instruction.opcode != OPCODE::BGE &&
                 mem_wb.instruction.opcode != OPCODE::NOP) {

            operand1 = mem_wb.writeData;
        }
    }

    // ---------- Forward for operand2 ----------
    if (rs2 >= 0) {

        if (ex_mem.instruction.rd == rs2 &&
            ex_mem.instruction.rd > 0 &&
            ex_mem.instruction.opcode != OPCODE::SW &&
            ex_mem.instruction.opcode != OPCODE::BNE &&
            ex_mem.instruction.opcode != OPCODE::BLT &&
            ex_mem.instruction.opcode != OPCODE::BGE &&
            ex_mem.instruction.opcode != OPCODE::LW &&
            ex_mem.instruction.opcode != OPCODE::NOP) {

            operand2 = ex_mem.aluResult;
        }

        else if (mem_wb.instruction.rd == rs2 &&
                 mem_wb.instruction.rd > 0 &&
                 mem_wb.instruction.opcode != OPCODE::SW &&
                 mem_wb.instruction.opcode != OPCODE::BNE &&
                 mem_wb.instruction.opcode != OPCODE::BLT &&
                 mem_wb.instruction.opcode != OPCODE::BGE &&
                 mem_wb.instruction.opcode != OPCODE::NOP) {

            operand2 = mem_wb.writeData;
        }
    }
}