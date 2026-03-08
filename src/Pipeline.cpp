#include "Pipeline.hpp"
#include <cassert>
#include <iostream>

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


    
        // =========================================================
        // 5. WB STAGE
        // =========================================================
        Instruction wbInst = mem_wb.instruction;
    
        if (wbInst.opcode != OPCODE::NOP) {
            if (wbInst.rd >= 0 && wbInst.opcode != OPCODE::SW) {
                registerFile.write(wbInst.rd, mem_wb.writeData);
            }
            stats.incrementInstruction();
        }
    
        // =========================================================
        // 6. CLOCK EDGE: COMMIT THE NEXT STATE TO CURRENT STATE
        // =========================================================
        
                    

    // =========================================================
    // 0. CREATE "NEXT STATE" BUFFERS (Double Buffering)
    // =========================================================
    // We write to these during the cycle so we don't clobber the current state.
    IF_ID next_if_id = if_id;
    ID_EX next_id_ex = id_ex;
    EX_MEM next_ex_mem = ex_mem;
    MEM_WB next_mem_wb = mem_wb;

    // =========================================================
    // 1. IF STAGE
    // =========================================================
    if (!stall) {
        if (pc < instructions.size()) {
            next_if_id.instruction = instructions[pc];
            next_if_id.pc = pc;
            pc++;
        }
        else {
            next_if_id.instruction = Instruction();
        }
    }

    // =========================================================
    // 2. ID STAGE & HAZARD DETECTION
    // =========================================================
    stall = hazardUnit.shouldStall(if_id, id_ex);

    if (stall) { 
        stats.incrementStall();
        next_id_ex = {Instruction(), -1, 0, 0}; // Insert bubble
    }
    else {
        next_id_ex.instruction = if_id.instruction;
        next_id_ex.pc = if_id.pc;

        Instruction idInst = if_id.instruction;
        next_id_ex.operand1 = (idInst.rs1 >= 0) ? registerFile.read(idInst.rs1) : 0;
        next_id_ex.operand2 = (idInst.rs2 >= 0) ? registerFile.read(idInst.rs2) : 0;
    }
    // =========================================================
    // 3. EX STAGE
    // =========================================================
    Instruction exInst = id_ex.instruction;
    int op1 = id_ex.operand1;
    int op2 = id_ex.operand2;

    // Forwarding is safe now! We read from the current ex_mem/mem_wb registers.
    if (config.isForwardingEnabled()) {
        forwardingUnit.resolveForwarding(id_ex, ex_mem, mem_wb, op1, op2);
    }

    next_ex_mem.instruction = exInst;
    next_ex_mem.operand2 = 0;
    next_ex_mem.aluResult = 0;

    if (exInst.opcode == OPCODE::ADD) next_ex_mem.aluResult = op1 + op2;
    else if (exInst.opcode == OPCODE::SUB) next_ex_mem.aluResult = op1 - op2;
    else if (exInst.opcode == OPCODE::ADDI) next_ex_mem.aluResult = op1 + exInst.immediate;
    else if (exInst.opcode == OPCODE::LW) next_ex_mem.aluResult = op1 + exInst.immediate;
    else if (exInst.opcode == OPCODE::SW) {
        next_ex_mem.aluResult = op1 + exInst.immediate; // Base address
        next_ex_mem.operand2 = op2;                     // Store value MUST be forwarded op2
    }
    else if (exInst.opcode == OPCODE::BNE) {
        if (op1 != op2) {
            pc = exInst.immediate;
            
            // IMMEDIATELY squash the wrong instructions fetched this cycle!
            next_if_id = {Instruction(), -1};
            next_id_ex = {Instruction(), -1, 0, 0};
        }
    }
    else if (exInst.opcode == OPCODE::JAL) {
        next_ex_mem.aluResult = id_ex.pc + 1;
        pc = exInst.immediate;
        
        // IMMEDIATELY squash the wrong instructions fetched this cycle!
        next_if_id = {Instruction(), -1};
        next_id_ex = {Instruction(), -1, 0, 0};
    }
    // =========================================================
    // 4. MEM STAGE
    // =========================================================
    next_mem_wb.instruction = ex_mem.instruction;
    Instruction memInst = ex_mem.instruction;

    if (memInst.opcode == OPCODE::LW) {
        next_mem_wb.writeData = memory.load(ex_mem.aluResult);
    }
    else if (memInst.opcode == OPCODE::SW) {
        memory.store(ex_mem.aluResult, ex_mem.operand2);
        next_mem_wb.writeData = 0;
    }
    else {
        next_mem_wb.writeData = ex_mem.aluResult;
    }
    
    // // Logging & Stats
    // std::cout << "Cycle " << stats.getCycleCount() << " | "
    //           << "IF: " << (int)if_id.instruction.opcode << " "
    //           << "ID: " << (int)id_ex.instruction.opcode << " "
    //           << "EX: " << (int)ex_mem.instruction.opcode << " "
    //           << "MEM: " << (int)mem_wb.instruction.opcode << std::endl;

    if_id = next_if_id;
        id_ex = next_id_ex;
        ex_mem = next_ex_mem;
        mem_wb = next_mem_wb;
    stats.incrementCycle();
}
bool Pipeline::hasPendingInstructions() const {

    return if_id.instruction.opcode != OPCODE::NOP ||
           id_ex.instruction.opcode != OPCODE::NOP ||
           ex_mem.instruction.opcode != OPCODE::NOP ||
           mem_wb.instruction.opcode != OPCODE::NOP;
}