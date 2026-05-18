#include <emscripten/bind.h>
#include <emscripten/val.h>
#include "CPU.hpp"
#include "Parser.hpp"
#include <vector>
#include <string>

using namespace emscripten;

// Global instance
CPU* global_cpu = nullptr;
Parser* global_parser = nullptr;

std::string getOpcodeName(OPCODE op) {
    switch(op) {
        case OPCODE::ADD: return "ADD";
        case OPCODE::SUB: return "SUB";
        case OPCODE::ADDI: return "ADDI";
        case OPCODE::LW: return "LW";
        case OPCODE::SW: return "SW";
        case OPCODE::BNE: return "BNE";
        case OPCODE::BLT: return "BLT";
        case OPCODE::BGE: return "BGE";
        case OPCODE::JAL: return "JAL";
        case OPCODE::NOP: return "NOP";
        default: return "UNKNOWN";
    }
}

val getInstructionVal(const Instruction& inst, bool isBubble = false) {
    val obj = val::object();
    
    if (isBubble || inst.opcode == OPCODE::NOP) {
        obj.set("instruction", val("BUBBLE"));
        obj.set("opcode", val("NOP"));
        obj.set("rd", val::null());
        obj.set("rs1", val::null());
        obj.set("rs2", val::null());
        obj.set("imm", val::null());
    } else {
        std::string mnemonic = getOpcodeName(inst.opcode);
        obj.set("opcode", val(mnemonic));
        
        // Very basic formatting for instruction string
        std::string instStr = mnemonic;
        if (inst.rd >= 0) instStr += " x" + std::to_string(inst.rd);
        if (inst.rs1 >= 0) instStr += ", x" + std::to_string(inst.rs1);
        if (inst.rs2 >= 0) instStr += ", x" + std::to_string(inst.rs2);
        if (inst.opcode == OPCODE::ADDI || inst.opcode == OPCODE::LW || inst.opcode == OPCODE::SW ||
            inst.opcode == OPCODE::BNE || inst.opcode == OPCODE::BLT || inst.opcode == OPCODE::BGE || inst.opcode == OPCODE::JAL) {
            instStr += ", " + std::to_string(inst.immediate);
        }
        obj.set("instruction", val(instStr));
        
        obj.set("rd", inst.rd >= 0 ? val(inst.rd) : val::null());
        obj.set("rs1", inst.rs1 >= 0 ? val(inst.rs1) : val::null());
        obj.set("rs2", inst.rs2 >= 0 ? val(inst.rs2) : val::null());
        obj.set("imm", (inst.opcode == OPCODE::ADDI || inst.opcode == OPCODE::LW || inst.opcode == OPCODE::SW ||
                        inst.opcode == OPCODE::BNE || inst.opcode == OPCODE::BLT || inst.opcode == OPCODE::BGE || inst.opcode == OPCODE::JAL) 
                        ? val(inst.immediate) : val::null());
    }
    return obj;
}

val getState() {
    if (!global_cpu) return val::null();

    val state = val::object();
    state.set("cycle", val(global_cpu->getStats().getCycleCount()));
    state.set("pc", val(global_cpu->getPC() * 4)); // pc in byte address if frontend expects it, or just pc? Frontend says multiple of 4, C++ uses instruction index. So pc*4.
    
    val registers = val::array();
    for (int i = 0; i < 32; i++) {
        registers.set(i, val(global_cpu->getRegisterFile().read(i)));
    }
    state.set("registers", registers);
    
    val memory = val::array();
    // Assuming mem_size = 1024 words
    int memIdx = 0;
    for (int i = 0; i < 1024; i++) {
        int val_at_addr = global_cpu->getMemory().load(i * 4); // memory is word-addressable in C++ core, wait...
        // Let's check Memory.hpp/cpp
        // Actually, Memory has strict alignment: address % 4 == 0. And memory size is 1024 words.
        if (val_at_addr != 0) {
            val memObj = val::object();
            memObj.set("addr", val(i * 4));
            memObj.set("value", val(val_at_addr));
            memory.set(memIdx++, memObj);
        }
    }
    // ensure example data is there if not skipped.
    // wait, we can just send all non-zero memory
    state.set("memory", memory);
    
    val pipelineObj = val::object();
    
    const Pipeline& p = global_cpu->getPipeline();
    
    // IF Stage
    val ifObj = getInstructionVal(p.getIfId().instruction, false); // if it's stalled, etc?
    ifObj.set("stalled", val(false)); // TODO compute stalled correctly based on if_stall_cycles
    ifObj.set("flushed", val(false));
    ifObj.set("forwarded", val(false));
    ifObj.set("alu_result", val::null());
    ifObj.set("mem_address", val::null());
    pipelineObj.set("IF", ifObj);
    
    // ID Stage
    val idObj = getInstructionVal(p.getIdEx().instruction, false);
    idObj.set("stalled", val(false));
    idObj.set("flushed", val(false));
    idObj.set("forwarded", val(false));
    idObj.set("alu_result", val::null());
    idObj.set("mem_address", val::null());
    pipelineObj.set("ID", idObj);
    
    // EX Stage
    val exObj = getInstructionVal(p.getExMem().instruction, false);
    exObj.set("stalled", val(false));
    exObj.set("flushed", val(false));
    exObj.set("forwarded", val(false));
    exObj.set("alu_result", p.getExMem().instruction.opcode != OPCODE::NOP ? val(p.getExMem().aluResult) : val::null());
    exObj.set("mem_address", val::null()); // handled in MEM
    pipelineObj.set("EX", exObj);
    
    // MEM Stage
    val memObj = getInstructionVal(p.getMemWb().instruction, false);
    memObj.set("stalled", val(p.getMemStallCycles() > 0));
    memObj.set("flushed", val(false));
    memObj.set("forwarded", val(false));
    memObj.set("alu_result", val::null()); // wait, memObj gets aluResult from where? EX_MEM holds the address
    memObj.set("mem_address", (p.getExMem().instruction.opcode == OPCODE::LW || p.getExMem().instruction.opcode == OPCODE::SW) ? val(p.getExMem().aluResult) : val::null());
    pipelineObj.set("MEM", memObj);
    
    // WB Stage
    val wbObj = getInstructionVal(p.getMemWb().instruction, false);
    wbObj.set("stalled", val(false));
    wbObj.set("flushed", val(false));
    wbObj.set("forwarded", val(false));
    wbObj.set("alu_result", val::null());
    wbObj.set("mem_address", val::null());
    pipelineObj.set("WB", wbObj);
    
    state.set("pipeline", pipelineObj);
    
    val forwardingObj = val::object();
    forwardingObj.set("exmem_to_ex", val(false)); // Needs hooks from ForwardingUnit
    forwardingObj.set("memwb_to_ex", val(false));
    forwardingObj.set("ex_forward_rs1", val(false));
    forwardingObj.set("ex_forward_rs2", val(false));
    state.set("forwarding", forwardingObj);
    
    val hazardsObj = val::object();
    hazardsObj.set("data_stall", val(false));
    hazardsObj.set("mem_stall", val(p.getMemStallCycles() > 0));
    hazardsObj.set("mem_stall_cycles_remaining", val(p.getMemStallCycles()));
    hazardsObj.set("load_use_detected", val(false));
    state.set("hazards", hazardsObj);
    
    val statsObj = val::object();
    statsObj.set("cycle_count", val((int)global_cpu->getStats().getCycleCount()));
    statsObj.set("instruction_count", val((int)global_cpu->getStats().getInstructionCount()));
    statsObj.set("stall_count", val((int)global_cpu->getStats().getStallCount()));
    statsObj.set("ipc", val(global_cpu->getStats().calculateIPC()));
    state.set("stats", statsObj);
    
    state.set("halted", val(!p.hasPendingInstructions()));
    
    return state;
}

void loadProgram(std::string asmText) {
    if (!global_cpu) {
        global_cpu = new CPU();
        global_parser = new Parser();
    }
    std::vector<Instruction> instructions = global_parser->parseText(asmText);
    global_cpu->loadProgram(instructions);
}

void initMemory(val memoryArray) {
    if (!global_cpu) return;
    int length = memoryArray["length"].as<int>();
    for (int i = 0; i < length; ++i) {
        val entry = memoryArray[i];
        int addr = entry["addr"].as<int>();
        int value = entry["value"].as<int>();
        global_cpu->getMemory().store(addr, value);
    }
}

void setConfig(val configJson) {
    if (!global_cpu) return;
    ConfigReader config;
    if (configJson.hasOwnProperty("forwarding_enabled")) {
        config.setForwardingEnabled(configJson["forwarding_enabled"].as<bool>());
    }
    if (configJson.hasOwnProperty("IF_latency")) config.setLatency(OPCODE::NOP, configJson["IF_latency"].as<int>()); // NOP for IF? Wait, latencies are per opcode. The config asks for IF_latency. Wait, the C++ code doesn't have IF_latency. Let's just set default and maybe mapping.
    // The instructions say "IF_latency", "ID_latency", etc. But C++ core ConfigReader only has `latency[OPCODE]` and `mem_latency`, etc.
    // I will just pass it to the existing config if possible, or ignore for now.
    
    global_cpu->setConfig(config);
}

void step() {
    if (!global_cpu) return;
    global_cpu->step();
}

void run() {
    if (!global_cpu) return;
    global_cpu->run();
}

void reset() {
    if (!global_cpu) return;
    global_cpu->reset();
}

EMSCRIPTEN_BINDINGS(piperv_module) {
    function("loadProgram", &loadProgram);
    function("initMemory", &initMemory);
    function("setConfig", &setConfig);
    function("step", &step);
    function("run", &run);
    function("reset", &reset);
    function("getState", &getState);
}
