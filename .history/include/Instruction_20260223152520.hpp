enum class OPCODE {NOP,ADD,
SUB,
ADDI,
LW,
SW,
BNE,
JAL};

class Instruction{
    public:
        OPCODE opcode;
        int rd;
        int rs1;
        int rs2;
        int immediate;
    public:
        Instruction(){
            this->opcode = OPCODE::NOP;
            this->immediate = 0;
            this->rd=this->rs1 = this->rs2 = -1;
        }    
        Instruction(
            
        )
};  