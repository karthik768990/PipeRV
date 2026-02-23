#include <vector>
using namespace std;
class Register{
    private:
        vector<uint8_t> registers;
    public:
        Register(){
            registers = registers(32,0)
        }
};