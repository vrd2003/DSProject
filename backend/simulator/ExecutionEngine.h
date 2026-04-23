#pragma once
#include "../parser/AST.h"
#include "../structures/Memory.h"
#include <vector>
#include <string>

struct WaitingInputException {
    std::string var;
};

struct Step {
    int line;
    std::string action;
    std::string var;
    int value;
};

class ExecutionEngine {
    Memory memory;
    std::vector<Step> steps;
    int line = 1;
    std::vector<int> inputs;
    size_t inputIndex = 0;
    int totalOperations = 0;

public:
    void setInputs(const std::vector<int>& in) { inputs = in; }
    std::vector<Step> run(Node* root);

private:
    int eval(Node* node);
    void execute(Node* node);
};