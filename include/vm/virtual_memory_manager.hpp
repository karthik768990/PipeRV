#pragma once
#include "vm/tlb.hpp"
#include "vm/page_table.hpp"
#include "vm/frame_manager.hpp"
#include "Stats.hpp"
#include "ConfigReader.hpp"

class VirtualMemoryManager {
    TLB dtlb;
    PageTable pt;
    FrameManager fm;
    int page_size;
    int tlb_hit_latency;
    int page_walk_latency;
    int page_fault_latency;
    Stats* stats;

public:
    VirtualMemoryManager(const ConfigReader& config, Stats* stats);
    unsigned int translate(unsigned int va, bool isWrite, int& penalty_cycles);
};
