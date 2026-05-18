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

        // Phase 3 VM Parameters
        int virtual_size_bytes = 65536;
        int physical_size_bytes = 16384;
        int page_size_bytes = 4096;
        int dtlb_entries = 4;
        int tlb_hit_latency = 1;
        int page_walk_latency = 10;
        int page_fault_latency = 50;
        std::string replacement_policy = "lru";

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

        int getVirtualSizeBytes() const { return virtual_size_bytes; }
        int getPhysicalSizeBytes() const { return physical_size_bytes; }
        int getPageSizeBytes() const { return page_size_bytes; }
        int getDtlbEntries() const { return dtlb_entries; }
        int getTlbHitLatency() const { return tlb_hit_latency; }
        int getPageWalkLatency() const { return page_walk_latency; }
        int getPageFaultLatency() const { return page_fault_latency; }
        std::string getReplacementPolicy() const { return replacement_policy; }
        
        void setForwardingEnabled(bool val) { forwardingEnabled = val; }
        void setLatency(OPCODE op, int lat) { latency[static_cast<int>(op)] = lat; }
        void setL1Size(int val) { l1_size = val; }
        void setL1BlockSize(int val) { l1_blockSize = val; }
        void setL1Assoc(int val) { l1_assoc = val; }
        void setL1Latency(int val) { l1_latency = val; }
        void setL2Size(int val) { l2_size = val; }
        void setL2BlockSize(int val) { l2_blockSize = val; }
        void setL2Assoc(int val) { l2_assoc = val; }
        void setL2Latency(int val) { l2_latency = val; }
        void setMemLatency(int val) { mem_latency = val; }
};