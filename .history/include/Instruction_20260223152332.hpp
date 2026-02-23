enum class OPCODE {NOP,ADD,
SUB,
ADDI,
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
            this->opcode = OPCODE::NOP;
            this->immediate = 0;
            this->rd=this->rs1 = this->rs2 = -1;
        }    
        Instruction(OPCODE opcode,int rd,int rs1,int rs2){
            this->opcode = opcode;
            this->rd = rd;
            this->rs1 = rs1;
            this->rs2 = rs2;
            this->immediate = 0;
        }
        Instruction(OPCODE opcode,int rd,int rs){
            this->opcode = opcode;
            this->rd = rd;
            this->rs1 = rs;
            this->rs2 = -1;
            this->immediate = 0;
        }
        Instruction(OPCODE opcode,int rd,int rs,int immediate){
            this->opcode = opcode;
            this->rs1 = rs;
            this->rd = rd;
            this->immediate = immediate;
        }
        
};  