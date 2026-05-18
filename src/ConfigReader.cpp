    #include "ConfigReader.hpp"
    #include <fstream>
    #include <cstring>
    #include <sstream>
    #include <assert.h>
    #include <cctype>

    void ConfigReader::setDefaultLatencies(){
        for(int i=0;i<static_cast<int> (OPCODE::COUNT);i++)latency[i]=1;
    }

    int ConfigReader::getLatency(OPCODE opcode) const{
        return latency[static_cast<int>(opcode)];
    }

    bool ConfigReader::isForwardingEnabled() const{
        return forwardingEnabled;
    }
    static void toUpper(std::string& s){
        for(char& c : s){
            c = toupper(c);
        }
    }
    void ConfigReader::loadConfig(const std::string& filename){
        std::ifstream file(filename);
        assert(file.is_open());

        std::string line;

        while (std::getline(file, line)) {

            if (line.empty()) continue;

            std::stringstream ss(line);
            std::string key, value;

            if (!std::getline(ss, key, '=')) continue;
            if (!std::getline(ss, value)) continue;

            auto trim = [](std::string s) {
                int start = s.find_first_not_of(" \t\r\n");
                int end = s.find_last_not_of(" \t\r\n");
                if (start == std::string::npos) return std::string("");
                return s.substr(start, end - start + 1);
            };

            // Trim leading/trailing spaces from key and value
            key = trim(key);
            value = trim(value);

            toUpper(key); // to make the simulator case insensitive 

            int val = 0;
            try {
                val = std::stoi(value);
            } catch (...) {
                // Ignore parsing integer if it's a string like 'lru'
            }


            if (key == "FORWARDING") {
                forwardingEnabled = (val != 0);
                continue;
            }
        if (key == "L1_SIZE") { l1_size = val; continue; }
        if (key == "L1_BLOCK_SIZE") { l1_blockSize = val; continue; }
        if (key == "L1_ASSOC") { l1_assoc = val; continue; }
        if (key == "L1_LATENCY") { l1_latency = val; continue; }
        
        if (key == "L2_SIZE") { l2_size = val; continue; }
        if (key == "L2_BLOCK_SIZE") { l2_blockSize = val; continue; }
        if (key == "L2_ASSOC") { l2_assoc = val; continue; }
        if (key == "L2_LATENCY") { l2_latency = val; continue; }
        
        if (key == "MEM_LATENCY") { mem_latency = val; continue; }

            OPCODE opcode;

            if (key == "ADD") opcode = OPCODE::ADD;
            else if (key == "SUB") opcode = OPCODE::SUB;
            else if (key == "ADDI") opcode = OPCODE::ADDI;
            else if (key == "LW") opcode = OPCODE::LW;
            else if (key == "SW") opcode = OPCODE::SW;
            else if (key == "BNE") opcode = OPCODE::BNE;
            else if (key == "JAL") opcode = OPCODE::JAL;
            else if(key=="BLT")opcode = OPCODE::BLT;
            else if(key=="BGE")opcode = OPCODE::BGE;
            else continue;

            // Memory & Cache Config Parsing
            if (key == "L1_SIZE") l1_size = val;
            else if (key == "L1_BLOCK_SIZE") l1_blockSize = val;
            else if (key == "L1_ASSOC") l1_assoc = val;
            else if (key == "L1_LATENCY") l1_latency = val;
            
            else if (key == "L2_SIZE") l2_size = val;
            else if (key == "L2_BLOCK_SIZE") l2_blockSize = val;
            else if (key == "L2_ASSOC") l2_assoc = val;
            else if (key == "L2_LATENCY") l2_latency = val;
            
            else if (key == "MEM_LATENCY") mem_latency = val;
            
            // VM Config Parsing
            else if (key == "VIRTUAL_SIZE_BYTES") virtual_size_bytes = val;
            else if (key == "PHYSICAL_SIZE_BYTES") physical_size_bytes = val;
            else if (key == "PAGE_SIZE_BYTES") page_size_bytes = val;
            else if (key == "DTLB_ENTRIES") dtlb_entries = val;
            else if (key == "TLB_HIT_LATENCY") tlb_hit_latency = val;
            else if (key == "PAGE_WALK_LATENCY") page_walk_latency = val;
            else if (key == "PAGE_FAULT_LATENCY") page_fault_latency = val;
            else if (key == "REPLACEMENT_POLICY") {
                // value is string, we converted key to upper but not value. Let's make value lower
                std::string policy = value;
                for(char& c : policy) c = tolower(c);
                replacement_policy = policy;
            }
            else latency[static_cast<int>(opcode)] = val;
        }

        validateConfig();
    }

    void ConfigReader::validateConfig(){
        for(int i=0;i<static_cast<int> (OPCODE::COUNT);i++) assert(latency[i]>0);
    }