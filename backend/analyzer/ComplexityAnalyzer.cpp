#include "ComplexityAnalyzer.h"
#include <algorithm>

int ComplexityAnalyzer::calculateDepth(Node* node) {
    if (!node) return 0;
    
    int maxChildDepth = 0;
    for (auto child : node->children) {
        maxChildDepth = std::max(maxChildDepth, calculateDepth(child));
    }
    
    if (node->type == FOR_NODE) {
        return 1 + maxChildDepth;
    }
    
    return maxChildDepth;
}

bool ComplexityAnalyzer::hasDivisionLogPattern(Node* node) {
    if (!node) return false;
    
    if (node->type == BINARY && node->value == "/") return true;
    
    for (auto child : node->children) {
        if (hasDivisionLogPattern(child)) return true;
    }
    return false;
}

std::string ComplexityAnalyzer::analyze(Node* root) {
    int depth = calculateDepth(root);
    bool hasLog = hasDivisionLogPattern(root);
    
    if (depth == 0) return "O(1)";
    if (depth == 1) {
        return hasLog ? "O(log n)" : "O(n)";
    }
    if (depth == 2) {
        return hasLog ? "O(n log n)" : "O(n^2)";
    }
    return "O(n^" + std::to_string(depth) + ")";
}
