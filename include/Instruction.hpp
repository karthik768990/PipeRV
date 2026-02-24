#pragma once
enum class OPCODE {NOP,ADD,
SUB,
ADDI,
LW,
SW,
BNE,
JAL,
COUNT};

class Instruction{
    public:
        OPCODE opcode;
        int rd;
        int rs1;
        int rs2;
        int immediate;

        Instruction(){
            this->opcode = OPCODE::NOP;
            this->immediate = 0;
            this->rd=this->rs1 = this->rs2 = -1;
        }    
        Instruction(
            OPCODE op,
            int rd = -1,
            int rs1 = -1,
            int rs2 = -1,
            int imm = 0
        ){
            this->opcode = op;
            this->rd = rd;
            this->rs1 = rs1;
            this->rs2 = rs2;
            this->immediate = imm;
        }
};  