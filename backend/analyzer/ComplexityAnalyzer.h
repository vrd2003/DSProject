#pragma once
#include "../parser/AST.h"
#include <string>

class ComplexityAnalyzer {
public:
    std::string analyze(Node* root);

private:
    int calculateDepth(Node* node);
    bool hasDivisionLogPattern(Node* node);
};
