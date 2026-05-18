#include "vm/page_table.hpp"

bool PageTable::lookup(unsigned int vpn, unsigned int& pfn, bool& dirty) {
    auto it = table.find(vpn);
    if (it != table.end() && it->second.valid) {
        pfn = it->second.pfn;
        dirty = it->second.dirty;
        return true;
    }
    return false;
}

void PageTable::update(unsigned int vpn, unsigned int pfn, bool valid, bool dirty) {
    table[vpn] = {valid, dirty, pfn};
}

void PageTable::setDirty(unsigned int vpn, bool dirty) {
    if (table.find(vpn) != table.end()) {
        table[vpn].dirty = dirty;
    }
}
