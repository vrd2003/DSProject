#include "ASTtoJSON.h"

std::string nodeTypeToString(NodeType type) {
    switch(type) {
        case PROGRAM: return "PROGRAM";
        case ASSIGN: return "ASSIGN";
        case NUMBER_NODE: return "NUMBER_NODE";
        case VAR: return "VAR";
        case BINARY: return "BINARY";
        case IF_NODE: return "IF_NODE";
        case FOR_NODE: return "FOR_NODE";
        case BLOCK: return "BLOCK";
        default: return "UNKNOWN";
    }
}

crow::json::wvalue astToJson(Node* root) {
    crow::json::wvalue res;
    if (!root) return res;

    res["type"] = nodeTypeToString(root->type);
    res["value"] = root->value;

    if (root->children.size() > 0) {
        std::vector<crow::json::wvalue> children_json;
        for (auto child : root->children) {
            children_json.push_back(astToJson(child));
        }
        res["children"] = std::move(children_json);
    } else {
        res["children"] = crow::json::wvalue::list(); // empty list
    }

    return res;
}
