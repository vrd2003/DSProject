#pragma once
#include <string>
#include <vector>

// 🔴 Add this to avoid hidden conflicts
#ifndef NODE_TYPE_DEFINED
#define NODE_TYPE_DEFINED

enum NodeType {
    PROGRAM,
    ASSIGN,
    NUMBER_NODE,
    VAR,
    BINARY,
    IF_NODE,
    FOR_NODE,
    BLOCK,
    CIN_NODE,
    WHILE_NODE
};

#endif

struct Node {
    NodeType type;
    std::string value;
    std::vector<Node*> children;

    Node(NodeType t, std::string v = "") : type(t), value(v) {}
};