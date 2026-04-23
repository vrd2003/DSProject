#pragma once

#include <vector>
#include "Token.h"   // 🔴 keep BEFORE AST
#include "AST.h"

class Parser {
    std::vector<Token> tokens;
    int pos;

public:
    Parser(std::vector<Token> t);
    Node* parse();

private:
    Node* parseBlock();
    Node* parseStatement();
    Node* parseIfStatement();
    Node* parseForStatement();
    Node* parseWhileStatement();
    Node* parseExpression();
    Node* parseAddSub();
    Node* parseTerm();
    Node* parseFactor();
};