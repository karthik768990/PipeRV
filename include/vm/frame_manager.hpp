#pragma once
#include <vector>
#include <list>
#include <string>

struct FrameInfo {
    bool valid;
    unsigned int vpn;
};

class FrameManager {
    int total_frames;
    int free_frames;
    std::string replacement_policy;
    std::vector<FrameInfo> frames;
    std::list<int> replacement_list;

public:
    FrameManager(int physical_size, int page_size, std::string policy);
    unsigned int allocateFrame(unsigned int vpn, unsigned int& evicted_vpn, bool& is_evicted);
    void accessFrame(int frame);
};
