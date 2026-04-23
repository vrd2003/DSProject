#pragma once
#include <map>
#include <string>

class Memory {
    std::map<std::string, int> vars;

public:
    void set(std::string key, int val) {
        vars[key] = val;
    }

    int get(std::string key) {
        if (vars.find(key) == vars.end()) return 0;
        return vars[key];
    }
};