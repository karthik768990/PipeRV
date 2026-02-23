enum OPCODE {ADD,
SUB,
ADDI,
SUBI,
LW,
SW,
BNE,
JAL};

class Instruction{
    private:
        OPCODE opcode;
        int rd;
        int rs1;
        int rs2;
        int immediateValue;

};