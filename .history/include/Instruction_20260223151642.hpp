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
        int immediate;
    public:
        Instruction(){
            this->immediate = -1;
            this->rd=this->rs1 = this->rs2 = -1;
        }    

};