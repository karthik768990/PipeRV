#include "Pipeline.hpp"
#include <cassert>

Pipeline::Pipeline() {
    reset();
}

void Pipeline::reset() {
    stall = false;
    flush = false;

    if_id = {Instruction(), -1};
    id_ex = {Instruction(), -1, 0, 0};
    ex_mem = {Instruction(), 0, 0};
    mem_wb = {Instruction(), 0};
}

void Pipeline::step(std::vector<Instruction>& instructions,
                    int& pc,
                    RegisterFile& registerFile,
                    Memory& memory,
                    Stats& stats,
                    ConfigReader& config) {

    // =========================
    // WB STAGE
    // =========================
    Instruction wbInst = mem_wb.instruction;

    if (wbInst.opcode != OPCODE::NOP) {

        if (wbInst.rd >= 0 && wbInst.opcode != OPCODE::SW) {
            registerFile.write(wbInst.rd, mem_wb.writeData);
        }

        stats.incrementInstruction();
    }

    // =========================
    // MEM STAGE
    // =========================
    mem_wb.instruction = ex_mem.instruction;

    Instruction memInst = ex_mem.instruction;

    if (memInst.opcode == OPCODE::LW) {
        mem_wb.writeData = memory.load(ex_mem.aluResult);
    }
    else if (memInst.opcode == OPCODE::SW) {
        memory.store(ex_mem.aluResult, ex_mem.operand2);
        mem_wb.writeData = 0;
    }
    else {
        mem_wb.writeData = ex_mem.aluResult;
    }

// =========================
// EX STAGE
// =========================
Instruction exInst = id_ex.instruction;

int op1 = id_ex.operand1;
int op2 = id_ex.operand2;

// Forwarding (only affects arithmetic operands)
if(config.isForwardingEnabled())
    forwardingUnit.resolveForwarding(id_ex, ex_mem, mem_wb, op1, op2);

ex_mem.instruction = exInst;
ex_mem.operand2 = 0;
ex_mem.aluResult = 0;

if (exInst.opcode == OPCODE::ADD) {
    ex_mem.aluResult = op1 + op2;
}
else if (exInst.opcode == OPCODE::SUB) {
    ex_mem.aluResult = op1 - op2;
}
else if (exInst.opcode == OPCODE::ADDI) {
    ex_mem.aluResult = op1 + exInst.immediate;
}
else if (exInst.opcode == OPCODE::LW) {
    ex_mem.aluResult = op1 + exInst.immediate;
}
else if (exInst.opcode == OPCODE::SW) {

    // address = base + offset
    ex_mem.aluResult = op1 + exInst.immediate;

    // IMPORTANT: store value must come from the register file,
    // NOT from forwarded operand2
    ex_mem.operand2 = id_ex.operand2;
}
else if (exInst.opcode == OPCODE::BNE) {

    if (op1 != op2) {
        pc = exInst.immediate;
        flush = true;
    }
}
else if (exInst.opcode == OPCODE::JAL) {

    ex_mem.aluResult = id_ex.pc + 1;
    pc = exInst.immediate;
    flush = true;
}
    // =========================
    // HAZARD DETECTION
    // =========================
    stall = hazardUnit.shouldStall(if_id, id_ex);

    if (stall) {

        stats.incrementStall();

        // Insert bubble
        id_ex = {Instruction(), -1, 0, 0};
    }
    else {

        // =========================
        // ID STAGE
        // =========================
        id_ex.instruction = if_id.instruction;
        id_ex.pc = if_id.pc;

        Instruction idInst = if_id.instruction;

        id_ex.operand1 = 0;
        id_ex.operand2 = 0;

        if (idInst.opcode != OPCODE::NOP) {

            if (idInst.rs1 >= 0)
                id_ex.operand1 = registerFile.read(idInst.rs1);

            if (idInst.rs2 >= 0)
                id_ex.operand2 = registerFile.read(idInst.rs2);
        }
    }

    // =========================
    // IF STAGE
    // =========================
    if (flush) {

        if_id = {Instruction(), -1};
        id_ex = {Instruction(), -1, 0, 0};
        ex_mem = {Instruction(), 0, 0};

        flush = false;
    }
    else if (!stall) {

        if (pc < instructions.size()) {
            if_id.instruction = instructions[pc];
            if_id.pc = pc;
            pc++;
        }
        else {
            if_id.instruction = Instruction();
        }
    }

    // =========================
    // CLOCK UPDATE
    // =========================
    stats.incrementCycle();
}

bool Pipeline::hasPendingInstructions() const {

    return if_id.instruction.opcode != OPCODE::NOP ||
           id_ex.instruction.opcode != OPCODE::NOP ||
           ex_mem.instruction.opcode != OPCODE::NOP ||
           mem_wb.instruction.opcode != OPCODE::NOP;
}