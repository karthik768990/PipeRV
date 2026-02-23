#pragma once

static constexpr int 
class RegisterFile {
private:
    int regs[32];

public:
    RegisterFile();
    int read(int index) const;
    void write(int index, int value);
    void reset();
};