#pragma once
#include "Instruction.hpp"
#include <string>

class ConfigReader{
    private:
        int latency[static_cast<int> (OPCODE::COUNT)];
        bool forwardingEnabled;
    public:
        ConfigReader(){
            forwardingEnabled = false;
            setDefaultLatencies();
        }         
        void loadConfig(std::string filename);
        int getLatency(OPCODE opcode) const;
        bool isForwardingEnabled() const;
        void setDefaultLatencies();
        void validateConfig();
};