#include "PatternDetector.h"

void PatternDetector::traverse(Node* node, int depth, bool& nestedLoops, bool& binarySearch) {
    if (!node) return;

    if (node->type == FOR_NODE) {
        depth++;
        if (depth > 1) nestedLoops = true;
    }

    if (node->type == BINARY && node->value == "/") {
        if (node->children.size() > 1 && node->children[1] && node->children[1]->value == "2") {
            binarySearch = true;
        }
    }

    for (auto child : node->children) {
        traverse(child, depth, nestedLoops, binarySearch);
    }
}

std::vector<std::string> PatternDetector::detect(Node* root) {
    std::vector<std::string> suggestions;
    bool nestedLoops = false;
    bool binarySearch = false;

    traverse(root, 0, nestedLoops, binarySearch);

    if (nestedLoops) {
        suggestions.push_back("Nested loops detected. Consider using hashing or two-pointers to reduce complexity from O(n^2).");
    }
    if (binarySearch) {
        suggestions.push_back("Binary search pattern detected. Excellent use of logarithmic division.");
    }
    
    if (suggestions.empty()) {
        suggestions.push_back("Code looks structurally sound, but always check for boundary conditions.");
    }

    return suggestions;
}
