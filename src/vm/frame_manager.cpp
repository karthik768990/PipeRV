#include "vm/frame_manager.hpp"
#include <algorithm>

FrameManager::FrameManager(int physical_size, int page_size, std::string policy) {
    if(page_size <= 0) page_size = 4096;
    total_frames = physical_size / page_size;
    if(total_frames <= 0) total_frames = 1; 
    free_frames = total_frames;
    replacement_policy = policy;
    frames.resize(total_frames, {false, 0});
}

unsigned int FrameManager::allocateFrame(unsigned int vpn, unsigned int& evicted_vpn, bool& is_evicted) {
    is_evicted = false;
    
    // Find free frame
    for (int i = 0; i < total_frames; ++i) {
        if (!frames[i].valid) {
            frames[i] = {true, vpn};
            replacement_list.push_back(i);
            free_frames--;
            return i;
        }
    }
    
    // Physical memory full -> Replace
    is_evicted = true;
    int victim_frame = replacement_list.front();
    replacement_list.pop_front();
    
    evicted_vpn = frames[victim_frame].vpn;
    
    frames[victim_frame] = {true, vpn};
    replacement_list.push_back(victim_frame);
    
    return victim_frame;
}

void FrameManager::accessFrame(int frame) {
    if (replacement_policy == "lru") {
        auto list_it = std::find(replacement_list.begin(), replacement_list.end(), frame);
        if (list_it != replacement_list.end()) {
            replacement_list.erase(list_it);
            replacement_list.push_back(frame);
        }
    }
}
