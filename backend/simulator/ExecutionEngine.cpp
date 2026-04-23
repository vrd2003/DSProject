#include "ExecutionEngine.h"
#include <string>

std::vector<Step> ExecutionEngine::run(Node* root) {
    totalOperations = 0;
    try {
        if (root && root->type == PROGRAM) {
            for (auto node : root->children) {
                if (totalOperations > 5000) break; 
                execute(node);
            }
        } else {
            execute(root);
        }
    } catch(const WaitingInputException& e) {
        steps.push_back({line, "waiting_input", e.var, 0});
    }
    return steps;
}

int ExecutionEngine::eval(Node* node) {
    if (!node) return 0;

    if (node->type == NUMBER_NODE) {
        try {
            return std::stoi(node->value);
        } catch(...) {
            return 0;
        }
    }

    if (node->type == VAR)
        return memory.get(node->value);

    if (node->type == BINARY) {
        int l = eval(node->children.size() > 0 ? node->children[0] : nullptr);
        int r = eval(node->children.size() > 1 ? node->children[1] : nullptr);

        if (node->value == "+") return l + r;
        if (node->value == "-") return l - r;
        if (node->value == "*") return l * r;
        if (node->value == "/") {
            if (r == 0) return 0;
            return l / r;
        }
        if (node->value == "<") return l < r ? 1 : 0;
        if (node->value == ">") return l > r ? 1 : 0;
        if (node->value == "==") return l == r ? 1 : 0;
        if (node->value == "<=") return l <= r ? 1 : 0;
        if (node->value == ">=") return l >= r ? 1 : 0;
        if (node->value == "!=") return l != r ? 1 : 0;
    }

    return 0;
}

void ExecutionEngine::execute(Node* node) {
    if (!node || totalOperations++ > 5000) return;

    if (node->type == BLOCK) {
        for (auto n : node->children) {
            execute(n);
        }
    } else if (node->type == ASSIGN) {
        int val = eval(node->children.size() > 0 ? node->children[0] : nullptr);
        memory.set(node->value, val);

        steps.push_back({line++, "assign", node->value, val});
    } else if (node->type == CIN_NODE) {
        if (inputIndex < inputs.size()) {
            int val = inputs[inputIndex++];
            memory.set(node->value, val);
            steps.push_back({line++, "input", node->value, val});
        } else {
            throw WaitingInputException{node->value};
        }
    } else if (node->type == IF_NODE) {
        if (node->children.size() > 0 && eval(node->children[0])) {
            if (node->children.size() > 1) {
                execute(node->children[1]);
            }
        }
    } else if (node->type == FOR_NODE) {
        // children[0] = init, children[1] = cond, children[2] = step, children[3] = body
        if (node->children.size() > 0 && node->children[0]) {
            execute(node->children[0]);
        }

        while (true) {
            if (totalOperations++ > 5000) break; // Global safety limit
            if (node->children.size() > 1 && node->children[1]) {
                if (!eval(node->children[1])) break;
            } else {
                break; // infinite loop protection if no condition
            }

            if (node->children.size() > 3 && node->children[3]) {
                execute(node->children[3]);
            }
            if (node->children.size() > 2 && node->children[2]) {
                execute(node->children[2]);
            }
        }
    } else if (node->type == WHILE_NODE) {
        while (true) {
             if (totalOperations++ > 5000) break; // Global safety limit
             if (node->children.size() > 0 && node->children[0]) {
                 if (!eval(node->children[0])) break;
             } else { break; }
             
             if (node->children.size() > 1 && node->children[1]) {
                 execute(node->children[1]);
             }
        }
    } else if (node->type == PROGRAM) {
        for (auto n : node->children) execute(n);
    } // Unknown nodes are skipped to prevent crashes on complex C++ features
}