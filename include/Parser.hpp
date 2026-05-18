#pragma once
#include <vector>
#include "Instruction.hpp"
#include <string>
#include <utility>
#include <unordered_map>
class Parser{
    private:
            std::unordered_map<std::string,int>labelMap;
    public:
        Parser(){

        }   
    private:    
        std::string removeComments(const std::string& line);
        std::string trimWhiteSpace(const std::string& line);
        int parseRegister(const std::string& registerString);
        Instruction parseLineToInstruction(const std::string& instructionLine) ;
        OPCODE convertOpCode(const std::string& opCodeString) ;
        bool containsLabel(const std::string& line);
        std::string extractLabel(const std::string& line);
        std::string removeLabel(const std::string& line);
        std::vector<std::string> tokenize(const std::string& line);
        std::pair<int, int> parseMemoryOperand(const std::string& operand);
    public:
        std::vector<Instruction> parse(const std::string& fileName);
        std::vector<Instruction> parseText(const std::string& text);
    };