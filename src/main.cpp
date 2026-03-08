#include <iostream>
#include "Parser.hpp"
#include "CPU.hpp"
#include "ConfigReader.hpp"

int main(int argc, char* argv[]) {

    if (argc < 3) {
        std::cerr << "Usage: simulator <config_file> <program_file>\n";
        return 1;
    }

    std::string configFile = argv[1];
    std::string programFile = argv[2];

    ConfigReader config;
    config.loadConfig(configFile);

    Parser parser;
    std::vector<Instruction> program = parser.parse(programFile);
    
    CPU cpu;
    cpu.loadProgram(program);
    std::cout << "\nInitial Memory State\n";
    cpu.dumpMemory(0, 16);

    cpu.run();
    std::cout << "\nFinal Memory State\n";
    cpu.dumpMemory(0, 16);
    const Stats& stats = cpu.getStats();

    std::cout << "Execution finished\n";
    std::cout << "Cycles: " << stats.getCycleCount() << "\n";
    std::cout << "Instructions: " << stats.getInstructionCount() << "\n";
    std::cout << "Stalls: " << stats.getStallCount() << "\n";
    std::cout << "IPC: " << stats.calculateIPC() << "\n";

    return 0;
}