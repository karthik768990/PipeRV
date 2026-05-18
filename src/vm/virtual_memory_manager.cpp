#include "vm/virtual_memory_manager.hpp"

VirtualMemoryManager::VirtualMemoryManager(const ConfigReader& config, Stats* stats) 
    : dtlb(config.getDtlbEntries(), config.getReplacementPolicy()),
      pt(),
      fm(config.getPhysicalSizeBytes(), config.getPageSizeBytes(), config.getReplacementPolicy()),
      page_size(config.getPageSizeBytes()),
      tlb_hit_latency(config.getTlbHitLatency()),
      page_walk_latency(config.getPageWalkLatency()),
      page_fault_latency(config.getPageFaultLatency()),
      stats(stats) {
      if(page_size <= 0) page_size = 4096;
}

unsigned int VirtualMemoryManager::translate(unsigned int va, bool isWrite, int& penalty_cycles) {
    unsigned int vpn = va / page_size;
    unsigned int offset = va % page_size;
    unsigned int pfn;
    
    penalty_cycles = 0;
    
    // 1. TLB Access
    if (dtlb.lookup(vpn, pfn, isWrite)) {
        stats->incrementTLBHits();
        penalty_cycles += tlb_hit_latency;
        
        // LRU access on frame
        fm.accessFrame(pfn);
        if (isWrite) pt.setDirty(vpn, true);
        
        stats->addTranslationPenalty(penalty_cycles);
        return (pfn * page_size) + offset;
    }
    
    // TLB Miss
    stats->incrementTLBMisses();
    penalty_cycles += tlb_hit_latency;
    
    // 2. Page Walk
    stats->incrementPageWalks();
    penalty_cycles += page_walk_latency;
    
    bool pt_dirty = false;
    if (pt.lookup(vpn, pfn, pt_dirty)) {
        // PT Hit
        if (isWrite) {
            pt_dirty = true;
            pt.setDirty(vpn, true);
        }
        dtlb.insert(vpn, pfn, pt_dirty);
        fm.accessFrame(pfn);
        stats->addTranslationPenalty(penalty_cycles);
        return (pfn * page_size) + offset;
    }
    
    // 3. Page Fault
    stats->incrementPageFaults();
    penalty_cycles += page_fault_latency;
    
    unsigned int evicted_vpn;
    bool is_evicted = false;
    pfn = fm.allocateFrame(vpn, evicted_vpn, is_evicted);
    
    if (is_evicted) {
        stats->incrementPageEvictions();
        bool evicted_was_dirty = false;
        unsigned int dump_pfn;
        if (pt.lookup(evicted_vpn, dump_pfn, evicted_was_dirty)) {
            if (evicted_was_dirty) {
                stats->incrementDirtyEvictions();
            }
        }
        
        dtlb.invalidate(evicted_vpn);
        pt.update(evicted_vpn, 0, false, false);
    }
    
    // Update PT with new frame
    pt.update(vpn, pfn, true, isWrite); 
    dtlb.insert(vpn, pfn, isWrite);
    
    stats->addTranslationPenalty(penalty_cycles);
    return (pfn * page_size) + offset;
}
