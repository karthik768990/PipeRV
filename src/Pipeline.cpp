#include "Pipeline.hpp"
#include <cassert>
#include <iostream>

Pipeline::Pipeline() {
    reset();
}

void Pipeline::reset() {
    stall = false;
    flush = false;
    mem_stall_cycles = 0;
    ex_cycles_remaining = 0; // Reset multi-cycle tracker
    mem_access_in_progress = false;
    if_id = {Instruction(), -1};
    id_ex = {Instruction(), -1, 0, 0};
    ex_mem = {Instruction(), 0, 0};
    mem_wb = {Instruction(), 0};
}

void Pipeline::step(std::vector<Instruction>& instructions,
                    int& pc,
                    RegisterFile& registerFile,
                    Memory& memory , Cache& L1D,
                    Stats& stats,
                    ConfigReader& config) {

    
    // 0. WB STAGE (Simulate falling-edge write)
    
    Instruction wbInst = mem_wb.instruction;
    
    if (wbInst.opcode != OPCODE::NOP) {
        if (wbInst.rd > 0 && 
            wbInst.opcode != OPCODE::SW && 
            wbInst.opcode != OPCODE::BNE &&
            wbInst.opcode != OPCODE::BLT &&
            wbInst.opcode != OPCODE::BGE) {
            registerFile.write(wbInst.rd, mem_wb.writeData);
        }
        stats.incrementInstruction();
    }

    
    // 1. CREATE "NEXT STATE" BUFFERS
    
    IF_ID next_if_id = if_id;
    ID_EX next_id_ex = id_ex;
    EX_MEM next_ex_mem = ex_mem;
    MEM_WB next_mem_wb = mem_wb;

    
    // 2. MULTI-CYCLE EXECUTION LOGIC (The Latency Fix!)
    
    bool ex_stall = false;
    
    if (id_ex.instruction.opcode != OPCODE::NOP) {
        // First cycle viewing this instruction: load its latency
        if (ex_cycles_remaining == 0) {
            ex_cycles_remaining = config.getLatency(id_ex.instruction.opcode);
        }

        // If it needs more than 1 cycle, stall the upper pipeline
        if (ex_cycles_remaining > 1) {
            ex_stall = true;
            ex_cycles_remaining--; 
        } else {
            // Execution finishes this cycle
            ex_cycles_remaining = 0; 
        }
    }

    
    // 3. HAZARD DETECTION (The Forwarding-OFF Fix!)
    
    bool data_stall = hazardUnit.shouldStall(if_id, id_ex);

    // If Forwarding is OFF, we MUST stall until the dependency writes to the Register File
    if (!config.isForwardingEnabled()) {
        int rs1 = if_id.instruction.rs1;
        int rs2 = if_id.instruction.rs2;
        
        // Helper to check if an instruction writes to a specific register
        auto isWritingToReg = [](int rs, const Instruction& inst) {
            return (rs > 0 && inst.rd == rs && 
                    inst.opcode != OPCODE::SW && inst.opcode != OPCODE::BNE && 
                    inst.opcode != OPCODE::BLT && inst.opcode != OPCODE::BGE && 
                    inst.opcode != OPCODE::NOP);
        };

        // If EX or MEM is currently working on rs1 or rs2, trigger a stall!
        if (isWritingToReg(rs1, id_ex.instruction) || isWritingToReg(rs2, id_ex.instruction) ||
            isWritingToReg(rs1, ex_mem.instruction) || isWritingToReg(rs2, ex_mem.instruction)) {
            data_stall = true;
        }
    }

 // 7. MEM STAGE (MOVED HERE to propagate stalls to IF/ID/EX in the same cycle)
    next_mem_wb.instruction = ex_mem.instruction;
    Instruction memInst = ex_mem.instruction;

    if (mem_stall_cycles > 0) {
        mem_stall_cycles--;
        stats.incrementStall();
        
        if (mem_stall_cycles > 0) {
            next_mem_wb.instruction = Instruction(); // FIX: Inject Bubble to prevent duplicate commits
        }
    }
    else {
        if ((memInst.opcode == OPCODE::LW || memInst.opcode == OPCODE::SW) 
            && !mem_access_in_progress) {

            bool hit = L1D.access(ex_mem.aluResult);
            mem_access_in_progress = true;

            if (!hit) {
                mem_stall_cycles = 3;
                stats.incrementStall();
                next_mem_wb.instruction = Instruction(); // FIX: Inject Bubble on initial miss
            }
        }
    }

    // Execute memory op immediately on hit, or exactly when stall finishes
    if (mem_stall_cycles == 0) {
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
        mem_access_in_progress = false; // Reset lock
    }

    // --- STALL PROPAGATION ---
    bool mem_stall = false;
    if (mem_stall_cycles > 0) {
        mem_stall = true;
    }

    // 4. IF STAGE (Leave the rest of IF, ID, EX as they are below here...)
    // 4. IF STAGE
    
    // Only fetch if EX isn't busy AND there are no data hazards
    if (!ex_stall && !data_stall && !mem_stall) {
        if (pc < instructions.size()) {
            next_if_id.instruction = instructions[pc];
            next_if_id.pc = pc;
            pc++;
        }
        else {
            next_if_id.instruction = Instruction();
        }
    }

    
    // 5. ID STAGE
    
    if (ex_stall||mem_stall) { 
        // EX is still processing latency: freeze ID completely
        next_id_ex = id_ex; 
    }
    else if (data_stall) { 
        // Data hazard: Insert a bubble to wait for dependencies
        stats.incrementStall();
        next_id_ex = {Instruction(), -1, 0, 0}; 
    }
    else {
        // Normal decode
        next_id_ex.instruction = if_id.instruction;
        next_id_ex.pc = if_id.pc;

        Instruction idInst = if_id.instruction;
        next_id_ex.operand1 = (idInst.rs1 >= 0) ? registerFile.read(idInst.rs1) : 0;
        next_id_ex.operand2 = (idInst.rs2 >= 0) ? registerFile.read(idInst.rs2) : 0;
    }

    
    // 6. EX STAGE
    
    if (ex_stall || mem_stall) {
        // Instruction is not done yet. Output a bubble to MEM.
        next_ex_mem = ex_mem;
        stats.incrementStall();
    } 
    else {
        // Instruction is finishing execution!
        Instruction exInst = id_ex.instruction;
        int op1 = id_ex.operand1;
        int op2 = id_ex.operand2;

        if (config.isForwardingEnabled()) {
            forwardingUnit.resolveForwarding(id_ex, ex_mem, mem_wb, op1, op2);
        }

        next_ex_mem.instruction = exInst;
        next_ex_mem.operand2 = 0;
        next_ex_mem.aluResult = 0;

        if (exInst.opcode == OPCODE::ADD) {
            next_ex_mem.aluResult = op1 + op2;
        }
        else if (exInst.opcode == OPCODE::SUB) {
            next_ex_mem.aluResult = op1 - op2;
        }
        else if (exInst.opcode == OPCODE::ADDI) {
            next_ex_mem.aluResult = op1 + exInst.immediate;
        }
        else if (exInst.opcode == OPCODE::LW) {
            next_ex_mem.aluResult = op1 + exInst.immediate;
        }
        else if (exInst.opcode == OPCODE::SW) {
            next_ex_mem.aluResult = op1 + exInst.immediate;
            next_ex_mem.operand2 = op2;                    
        }
        else if (exInst.opcode == OPCODE::BNE) {
            if (op1 != op2) {
                pc = exInst.immediate;
                next_if_id = {Instruction(), -1};
                next_id_ex = {Instruction(), -1, 0, 0};
            }
        }
        else if (exInst.opcode == OPCODE::BLT) {
            if (op1 < op2) {
                pc = exInst.immediate;
                next_if_id = {Instruction(), -1};
                next_id_ex = {Instruction(), -1, 0, 0};
            }
        }
        else if (exInst.opcode == OPCODE::BGE) {
            if (op1 >= op2) {
                pc = exInst.immediate;
                next_if_id = {Instruction(), -1};
                next_id_ex = {Instruction(), -1, 0, 0};
            }
        }
        else if (exInst.opcode == OPCODE::JAL) {
            next_ex_mem.aluResult = id_ex.pc + 1;
            pc = exInst.immediate;
            next_if_id = {Instruction(), -1};
            next_id_ex = {Instruction(), -1, 0, 0};
        }
    }

    
     
    // 8. CLOCK EDGE: COMMIT THE NEXT STATE TO CURRENT STATE
    
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