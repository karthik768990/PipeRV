#include "vm/tlb.hpp"
#include <algorithm>

TLB::TLB(int entries, std::string policy) : max_entries(entries), replacement_policy(policy) {
    if(max_entries <= 0) max_entries = 4;
}

bool TLB::lookup(unsigned int vpn, unsigned int& pfn, bool isWrite) {
    auto it = entries.find(vpn);
    if (it != entries.end()) {
        pfn = it->second.pfn;
        if (isWrite) {
            it->second.dirty = true;
        }
        if (replacement_policy == "lru") {
            auto list_it = std::find(replacement_list.begin(), replacement_list.end(), vpn);
            if (list_it != replacement_list.end()) {
                replacement_list.erase(list_it);
                replacement_list.push_back(vpn);
            }
        }
        return true;
    }
    return false;
}

void TLB::insert(unsigned int vpn, unsigned int pfn, bool dirty) {
    if (entries.find(vpn) != entries.end()) {
        entries[vpn] = {vpn, pfn, dirty};
        if (replacement_policy == "lru") {
            auto list_it = std::find(replacement_list.begin(), replacement_list.end(), vpn);
            if (list_it != replacement_list.end()) {
                replacement_list.erase(list_it);
                replacement_list.push_back(vpn);
            }
        }
        return;
    }

    if (entries.size() >= max_entries) {
        unsigned int victim_vpn = replacement_list.front();
        replacement_list.pop_front();
        entries.erase(victim_vpn);
    }
    
    entries[vpn] = {vpn, pfn, dirty};
    replacement_list.push_back(vpn);
}

void TLB::invalidate(unsigned int vpn) {
    auto it = entries.find(vpn);
    if (it != entries.end()) {
        entries.erase(it);
        auto list_it = std::find(replacement_list.begin(), replacement_list.end(), vpn);
        if (list_it != replacement_list.end()) {
            replacement_list.erase(list_it);
        }
    }
}
