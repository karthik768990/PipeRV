#pragma once

static constexpr 
class RegisterFile {
private:
    int regs[32];

public:
    RegisterFile();
    int read(int index) const;
    void write(int index, int value);
    void reset();
};