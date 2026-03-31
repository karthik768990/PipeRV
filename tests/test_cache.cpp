#include <iostream>
#include "Cache.hpp"

void testBasic() {
    Cache cache(64, 4, 2, 1, ReplacementPolicy::FIFO);

    std::cout << "\n===== BASIC HIT/MISS TEST =====\n";

    std::cout << cache.access(0) << " (MISS expected)\n";
    std::cout << cache.access(4) << " (MISS expected)\n";
    std::cout << cache.access(0) << " (HIT expected)\n";
}

void testSameBlock() {
    Cache cache(64, 4, 2, 1, ReplacementPolicy::FIFO);

    std::cout << "\n===== SAME BLOCK TEST =====\n";

    std::cout << cache.access(0) << " (MISS expected)\n";
    std::cout << cache.access(1) << " (HIT expected)\n";  // same block
}

void testSetMapping() {
    Cache cache(64, 4, 2, 1, ReplacementPolicy::FIFO);

    std::cout << "\n===== SET MAPPING TEST =====\n";

    std::cout << cache.access(0) << " (MISS expected)\n";
    std::cout << cache.access(16) << " (MISS expected - same set)\n";
    std::cout << cache.access(0) << " (HIT expected)\n";
}

void testFIFO() {
    std::cout << "\n===== FIFO TEST =====\n";

    Cache cache(16, 4, 2, 1, ReplacementPolicy::FIFO);

    cache.access(0);   // MISS
    cache.access(8);   // MISS
    cache.access(16);  // MISS → evict 0

    std::cout << cache.access(8) << " (HIT expected)\n";  // ✅
    std::cout << cache.access(0) << " (MISS expected)\n"; // ✅
}


void testLRU() {
    std::cout << "\n===== LRU TEST =====\n";

    Cache cache(16, 4, 2, 1, ReplacementPolicy::LRU);

    cache.access(0);   // MISS
    cache.access(8);   // MISS

    cache.access(0);   // HIT → makes 8 least recently used

    cache.access(16);  // MISS → should evict 8

    std::cout << cache.access(0) << " (HIT expected)\n";
    std::cout << cache.access(8) << " (MISS expected - evicted)\n";
}

int main() {

    std::cout << "===== CACHE TESTING START =====\n";

    testBasic();
    testSameBlock();
    testSetMapping();
    testFIFO();
    testLRU();

    std::cout << "\n===== TESTING COMPLETE =====\n";

    return 0;
}