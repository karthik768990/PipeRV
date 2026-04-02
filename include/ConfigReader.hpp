#pragma once
#include "Instruction.hpp"
#include <string>

class ConfigReader{
    private:
        int latency[static_cast<int> (OPCODE::COUNT)];
        bool forwardingEnabled;
        // Cache and Memory Parameters
        int l1_size = 1024, l1_blockSize = 64, l1_assoc = 2, l1_latency = 1;
        int l2_size = 4096, l2_blockSize = 64, l2_assoc = 4, l2_latency = 5;
        int mem_latency = 50;
    public:
        ConfigReader(){
            forwardingEnabled = false;
            setDefaultLatencies();
        }         
        void loadConfig(const std::string& filename);
        int getLatency(OPCODE opcode) const;
        bool isForwardingEnabled() const;
        void setDefaultLatencies();
        void validateConfig();
        int getL1Size() const { return l1_size; }
        int getL1BlockSize() const { return l1_blockSize; }
        int getL1Assoc() const { return l1_assoc; }
        int getL1Latency() const { return l1_latency; }
        
        int getL2Size() const { return l2_size; }
        int getL2BlockSize() const { return l2_blockSize; }
        int getL2Assoc() const { return l2_assoc; }
        int getL2Latency() const { return l2_latency; }
        
        int getMemLatency() const { return mem_latency; }
};