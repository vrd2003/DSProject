#pragma once
#include "../parser/AST.h"
#include <vector>
#include <string>

class PatternDetector {
public:
    std::vector<std::string> detect(Node* root);

private:
    void traverse(Node* node, int depth, bool& nestedLoops, bool& binarySearch);
};
