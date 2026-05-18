#pragma once
#include <unordered_map>

struct PTE {
    bool valid;
    bool dirty;
    unsigned int pfn;
};

class PageTable {
    std::unordered_map<unsigned int, PTE> table;

public:
    bool lookup(unsigned int vpn, unsigned int& pfn, bool& dirty);
    void update(unsigned int vpn, unsigned int pfn, bool valid, bool dirty);
    void setDirty(unsigned int vpn, bool dirty);
};
