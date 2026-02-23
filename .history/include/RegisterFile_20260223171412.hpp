#pragma once

static constexpr int NUM_REGS = 32;
class RegisterFile {
private:
    int regs[NUM_REGS];
    
public:
    RegisterFile();
    int read(int index) const;
    void write(int index, int value);
    void reset();
};