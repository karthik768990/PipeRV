#include <vector>
using namespace std;
class Register{
    private:
        vector<uint8t> registers(32);
    public:
        Register(){
            for(int i=0;i<32;i++){
                registers[i]= 0;
            }
            
        }
};