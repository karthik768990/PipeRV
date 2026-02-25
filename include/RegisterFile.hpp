#pragma once

class RegisterFile {
static constexpr int NUM_REGS = 32;
private:
    int regs[NUM_REGS];
    
public:
    RegisterFile();
    int read(int index) const;
    void write(int index, int value);
    void reset();
}; 