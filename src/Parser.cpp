#include "Parser.hpp"
#include <string>
#include <vector>
#include <assert.h>
#include <string>
#include <sstream>
#include <fstream>
#include <cctype>
#include "ConfigReader.hpp"

static std::string trim(std::string s) {
    int start = s.find_first_not_of(" ");
    int end = s.find_last_not_of(" ");
    if(start==std::string::npos && end==std::string::npos)return s;
    return s.substr(start, end - start + 1);
}

std::string Parser::removeComments(const std::string& line){
    for(int i=0;i<line.length();i++){
        if(line[i]=='#')return line.substr(0,i);
    }
    return line;
}

std::string Parser::trimWhiteSpace(const std::string& line){
    return trim(line);
}

bool Parser::containsLabel(const std::string& line){
        return line.find(':')!= std::string::npos;
}

std::string Parser::extractLabel(const std::string& line){
    int pos = line.find(':');
    return line.substr(0,pos);
}

std::string Parser::removeLabel(const std::string& line){
    int pos = line.find(':');
    std::string snippet = line.substr(pos+1);
    return trimWhiteSpace(snippet);
}

std::vector<std::string> Parser::tokenize(const std::string& line){
    std::string temp = line;

    for(char &c : temp){
        if(c == ',' || c == '(' || c == ')')
            c = ' ';
    }

    std::stringstream ss(temp);
    std::vector<std::string> tokens;
    std::string token;

    while(ss >> token){
        tokens.push_back(token);
    }

    return tokens;
}

int Parser::parseRegister(const std::string& registerString){
    assert(registerString[0]=='x');
    int registerNumber = std::stoi(registerString.substr(1));
    assert(registerNumber>=0 && registerNumber<=31);
    return registerNumber;
}

static void toUpper(std::string& s){
    for(char& c : s){
        c = toupper(c);
    }
}

OPCODE Parser::convertOpCode(const std::string& opCodeString){
    std::string opString = opCodeString;
    toUpper(opString);
    if(opString=="ADD")return OPCODE::ADD;
    else if(opString=="ADDI")return OPCODE::ADDI;
    else if(opString=="BNE")return OPCODE::BNE;
    else if(opString=="BLT")return OPCODE::BLT; // Added
    else if(opString=="BGE")return OPCODE::BGE; // Added
    else if(opString=="LW") return OPCODE::LW;
    else if(opString=="SUB")return OPCODE::SUB;
    else if(opString=="SW")return OPCODE::SW;
    else if(opString=="JAL")return OPCODE::JAL;
    else return OPCODE::NOP;
}

Instruction Parser::parseLineToInstruction(const std::string& instructionLine){
    std::vector<std::string> tokens = tokenize(instructionLine);
    OPCODE opcode = convertOpCode(tokens[0]);

    if (opcode==OPCODE::ADD || opcode==OPCODE::SUB){
        int rd = parseRegister(tokens[1]);
        int rs1 = parseRegister(tokens[2]);
        int rs2 = parseRegister(tokens[3]);

        Instruction instruction(opcode,rd,rs1,rs2,0);
        return instruction;
    }else if(opcode==OPCODE::ADDI){
        int rd = parseRegister(tokens[1]);
        int rs1 = parseRegister(tokens[2]);
        int imme = std::stoi(tokens[3]);
        Instruction instruction(opcode,rd,rs1,-1,imme);
        return instruction;
    }else if(opcode==OPCODE::LW){
        int rd = parseRegister(tokens[1]);
        int offset = std::stoi(tokens[2]);
        int rs1 = parseRegister(tokens[3]);
        return Instruction(opcode, rd, rs1, -1, offset);
    }
    else if(opcode==OPCODE::SW){
        int rs2 = parseRegister(tokens[1]);
        int offset = std::stoi(tokens[2]);
        int rs1 = parseRegister(tokens[3]);
        return Instruction(opcode, -1, rs1, rs2, offset);
    }
    // Added BLT and BGE here since they branch just like BNE
    else if(opcode == OPCODE::BNE || opcode == OPCODE::BLT || opcode == OPCODE::BGE){
        int rs1 = parseRegister(tokens[1]);
        int rs2 = parseRegister(tokens[2]);
        int target = labelMap[tokens[3]];
        return Instruction(opcode, -1, rs1, rs2, target);
    }
    else if(opcode == OPCODE::JAL){
        int rd = parseRegister(tokens[1]);
        int target = labelMap[tokens[2]];
        return Instruction(opcode, rd, -1, -1, target);
    }

    return Instruction();
}

std::pair<int,int> Parser::parseMemoryOperand(const std::string& operand){
    int open = operand.find('(');
    int close = operand.find(')');

    assert(open != std::string::npos && close != std::string::npos);

    int offset = std::stoi(operand.substr(0, open));
    std::string reg = operand.substr(open + 1, close - open - 1);

    int rs = parseRegister(reg);

    return {offset, rs};
}

std::vector<Instruction> Parser::parse(const std::string& fileName){

    std::ifstream file(fileName);
    assert(file.is_open());

    std::vector<std::string> lines;
    std::string line;

    while(std::getline(file, line)){
        line = removeComments(line);
        line = trimWhiteSpace(line);

        if(!line.empty())
            lines.push_back(line);
    }

    // PASS 1 : build label map
    int instructionIndex = 0;

    for(auto &l : lines){

        if(containsLabel(l)){
            std::string label = extractLabel(l);
            labelMap[label] = instructionIndex;

            l = removeLabel(l);

            if(l.empty())
                continue;
        }

        instructionIndex++;
    }

    // PASS 2 : build instructions
    std::vector<Instruction> instructions;

    for(auto &l : lines){

        if(containsLabel(l))
            l = removeLabel(l);

        if(l.empty())
            continue;

        instructions.push_back(parseLineToInstruction(l));
    }

    return instructions;
}