#pragma once
#include <vector>
#include <list>
#include <unordered_map>
#include <string>

struct TLBEntry {
    unsigned int vpn;
    unsigned int pfn;
    bool dirty;
};

class TLB {
    int max_entries;
    std::string replacement_policy;
    std::unordered_map<unsigned int, TLBEntry> entries;
    std::list<unsigned int> replacement_list;

public:
    TLB(int entries, std::string policy);
    bool lookup(unsigned int vpn, unsigned int& pfn, bool isWrite);
    void insert(unsigned int vpn, unsigned int pfn, bool dirty);
    void invalidate(unsigned int vpn);
};
