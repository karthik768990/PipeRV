#include "Pipeline.hpp"
#include "vm/virtual_memory_manager.hpp"
#include <cassert>
#include <iostream>

Pipeline::Pipeline() {
    reset();
}

void Pipeline::reset() {
    stall = false;
    flush = false;
    mem_stall_cycles = 0;
    if_stall_cycles = 0;
    current_pa = 0;
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
                    Memory& memory ,Cache& L1I, Cache& L1D,
                    Stats& stats,
                    ConfigReader& config,
                    VirtualMemoryManager* vmm) {

    
    // 0. WB STAGE (Simulate falling-edge write)
    
    Instruction wbInst = mem_wb.instruction;
    
    if (wbInst.opcode != OPCODE::NOP) {
        if (wbInst.rd > 0 && 
            wbInst.opcode != OPCODE::SW && 
            wbInst.opcode != OPCODE::S && 
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
        if (ex_cycles_remaining == 0) {
            ex_cycles_remaining = config.getLatency(id_ex.instruction.opcode);
        }

        if (ex_cycles_remaining > 1) {
            ex_stall = true;
            ex_cycles_remaining--; 
        } else {
            ex_cycles_remaining = 0; 
        }
    }

    
    
    bool data_stall = hazardUnit.shouldStall(if_id, id_ex);

    if (!config.isForwardingEnabled()) {
        int rs1 = if_id.instruction.rs1;
        int rs2 = if_id.instruction.rs2;
        
        auto isWritingToReg = [](int rs, const Instruction& inst) {
            return (rs > 0 && inst.rd == rs && 
                    inst.opcode != OPCODE::SW && inst.opcode != OPCODE::S && inst.opcode != OPCODE::BNE && 
                    inst.opcode != OPCODE::BLT && inst.opcode != OPCODE::BGE && 
                    inst.opcode != OPCODE::NOP);
        };

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
            next_mem_wb.instruction = Instruction(); 
        }
    }
    else {
        if ((memInst.opcode == OPCODE::LW || memInst.opcode == OPCODE::SW || memInst.opcode == OPCODE::L || memInst.opcode == OPCODE::S) 
            && !mem_access_in_progress) {

        int va = ex_mem.aluResult;
        bool isWrite = (memInst.opcode == OPCODE::SW || memInst.opcode == OPCODE::S);
        int total_latency = 0;
        
        if ((memInst.opcode == OPCODE::L || memInst.opcode == OPCODE::S) && vmm != nullptr) {
            int penalty = 0;
            current_pa = vmm->translate(va, isWrite, penalty);
            int cache_lat = L1D.access(current_pa);
            total_latency = penalty + cache_lat;
        } else {
            current_pa = va;
            total_latency = L1D.access(va);
        }

        mem_access_in_progress = true;

        if (total_latency > 1) {
            mem_stall_cycles = total_latency - 1; 
            stats.incrementStall();
            next_mem_wb.instruction = Instruction(); // Inject bubble
        }
        }
    }

    if (mem_stall_cycles == 0) {
        if (memInst.opcode == OPCODE::LW || memInst.opcode == OPCODE::L) {
            next_mem_wb.writeData = memory.load(current_pa);
        }
        else if (memInst.opcode == OPCODE::SW || memInst.opcode == OPCODE::S) {
            memory.store(current_pa, ex_mem.operand2);
            next_mem_wb.writeData = 0;
        }
        else {
            next_mem_wb.writeData = ex_mem.aluResult;
        }
        mem_access_in_progress = false; // Reset lock
    }

    bool mem_stall = (mem_stall_cycles > 0);

    // 4. IF STAGE (THE FREEZE FIX)
    bool if_stall = false;

    if (ex_stall || data_stall || mem_stall) {
        next_if_id = if_id; 
        
        if (if_stall_cycles > 0) {
            if_stall_cycles--;
        }
    } 
    else {
        if (if_stall_cycles > 0) {
            if_stall_cycles--;
            stats.incrementStall();
            if_stall = true;
            next_if_id = {Instruction(), -1}; 
        } 
        else {
            if (pc < instructions.size()) {
                int fetch_latency = L1I.access(pc * 4); 
                
                if (fetch_latency > 1) {
                    if_stall_cycles = fetch_latency - 1;
                    stats.incrementStall();
                    if_stall = true;
                    next_if_id = {Instruction(), -1}; 
                } else {
                    next_if_id.instruction = instructions[pc];
                    next_if_id.pc = pc;
                    pc++;
                }
            } else {
                next_if_id.instruction = Instruction(); 
            }
        }
    }

    

    // 5. ID STAGE 
    if (ex_stall || mem_stall) { 
        next_id_ex = id_ex; 
    }
    else if (data_stall) {   
        stats.incrementStall(); 
        next_id_ex = {Instruction(), -1, 0, 0}; 
    }
    else {
        next_id_ex.instruction = if_id.instruction;
        next_id_ex.pc = if_id.pc;

        Instruction idInst = if_id.instruction;
        next_id_ex.operand1 = (idInst.rs1 >= 0) ? registerFile.read(idInst.rs1) : 0;
        next_id_ex.operand2 = (idInst.rs2 >= 0) ? registerFile.read(idInst.rs2) : 0;
    }
    
    // 6. EX STAGE
    if (ex_stall || mem_stall) {
        next_ex_mem = ex_mem;
    } 
    else {
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
        else if (exInst.opcode == OPCODE::LW || exInst.opcode == OPCODE::L) {
            next_ex_mem.aluResult = (exInst.opcode == OPCODE::L) ? exInst.immediate : op1 + exInst.immediate;
        }
        else if (exInst.opcode == OPCODE::SW || exInst.opcode == OPCODE::S) {
            next_ex_mem.aluResult = (exInst.opcode == OPCODE::S) ? exInst.immediate : op1 + exInst.immediate;
            next_ex_mem.operand2 = (exInst.opcode == OPCODE::S) ? op1 : op2;                    
        }
        else if (exInst.opcode == OPCODE::MUL) {
            next_ex_mem.aluResult = op1 * op2;
        }
        else if (exInst.opcode == OPCODE::BNE) {
            if (op1 != op2) {
                pc = exInst.immediate;
                next_if_id = {Instruction(), -1};
                next_id_ex = {Instruction(), -1, 0, 0};
                if_stall_cycles = 0;
            }
        }
        else if (exInst.opcode == OPCODE::BLT) {
            if (op1 < op2) {
                pc = exInst.immediate;
                next_if_id = {Instruction(), -1};
                next_id_ex = {Instruction(), -1, 0, 0};
                if_stall_cycles = 0;
            }
        }
        else if (exInst.opcode == OPCODE::BGE) {
            if (op1 >= op2) {
                pc = exInst.immediate;
                next_if_id = {Instruction(), -1};
                next_id_ex = {Instruction(), -1, 0, 0};
                if_stall_cycles = 0;
            }
        }
        else if (exInst.opcode == OPCODE::JAL) {
            next_ex_mem.aluResult = id_ex.pc + 1;
            pc = exInst.immediate;
            next_if_id = {Instruction(), -1};
            next_id_ex = {Instruction(), -1, 0, 0};
                if_stall_cycles = 0;
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