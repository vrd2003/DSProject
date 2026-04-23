#include "Parser.h"

Parser::Parser(std::vector<Token> t) {
    tokens = t;
    pos = 0;
}

Node* Parser::parse() {
    Node* root = new Node(PROGRAM);

    while (pos < tokens.size()) {
        root->children.push_back(parseStatement());
    }

    return root;
}

Node* Parser::parseBlock() {
    Node* block = new Node(BLOCK);
    if (pos < tokens.size() && tokens[pos].value == "{") {
        pos++; // consume '{'
        while (pos < tokens.size() && tokens[pos].value != "}") {
            block->children.push_back(parseStatement());
        }
        if (pos < tokens.size() && tokens[pos].value == "}") pos++; // consume '}'
    } else {
        block->children.push_back(parseStatement()); // single statement
    }
    return block;
}

Node* Parser::parseStatement() {
    if (pos >= tokens.size()) return nullptr;

    if (tokens[pos].type == T_KEYWORD && (tokens[pos].value == "class" || tokens[pos].value == "struct")) {
        pos++; // skip 'class'
        while (pos < tokens.size() && tokens[pos].value != "{") pos++;
        if (pos < tokens.size()) parseBlock(); 
        return parseStatement();
    }

    if (tokens[pos].type == T_KEYWORD && (tokens[pos].value == "public" || tokens[pos].value == "private" || tokens[pos].value == "protected")) {
        pos++; 
        if (pos < tokens.size() && tokens[pos].value == ":") pos++;
        return parseStatement();
    }

    if (tokens[pos].type == T_KEYWORD && tokens[pos].value == "if") {
        return parseIfStatement();
    }
    if (tokens[pos].type == T_KEYWORD && tokens[pos].value == "for") {
        return parseForStatement();
    }
    if (tokens[pos].type == T_KEYWORD && tokens[pos].value == "while") {
        return parseWhileStatement();
    }

    // Safely skip type identifiers
    if (tokens[pos].type == T_KEYWORD && 
       (tokens[pos].value == "int" || tokens[pos].value == "float" || tokens[pos].value == "double" || tokens[pos].value == "bool" || tokens[pos].value == "long" || tokens[pos].value == "char" || tokens[pos].value == "string")) {
        pos++;
        if (pos >= tokens.size()) return nullptr;
    }

    // Skip 'using namespace'
    if (tokens[pos].type == T_KEYWORD && tokens[pos].value == "using") {
        while (pos < tokens.size() && tokens[pos].value != ";") pos++;
        if (pos < tokens.size()) pos++;
        return parseStatement();
    }

    // Skip 'cout'
    if (tokens[pos].type == T_IDENTIFIER && tokens[pos].value == "cout") {
        while (pos < tokens.size() && tokens[pos].value != ";") pos++;
        if (pos < tokens.size()) pos++;
        return parseStatement();
    }

    // Skip labels and break
    if (tokens[pos].type == T_KEYWORD && (tokens[pos].value == "case" || tokens[pos].value == "break" || tokens[pos].value == "switch")) {
        if (tokens[pos].value == "case") {
            while (pos < tokens.size() && tokens[pos].value != ":") pos++;
            if (pos < tokens.size()) pos++;
        } else if (tokens[pos].value == "switch") {
            pos++; // skip 'switch'
            if (pos < tokens.size() && tokens[pos].value == "(") {
                while (pos < tokens.size() && tokens[pos].value != ")") pos++;
                if (pos < tokens.size()) pos++;
            }
        } else {
            pos++; // skip 'break'
            if (pos < tokens.size() && tokens[pos].value == ";") pos++;
        }
        return parseStatement();
    }

    // Skip function signatures like main()
    if (tokens[pos].type == T_IDENTIFIER && pos + 1 < tokens.size() && tokens[pos+1].value == "(") {
        while (pos < tokens.size() && tokens[pos].value != ")") pos++;
        if (pos < tokens.size()) pos++;
        if (pos < tokens.size() && tokens[pos].value == "{") {
            return parseBlock();
        }
    }

    if (tokens[pos].type == T_IDENTIFIER && tokens[pos].value == "cin") {
        pos++; // consume 'cin'
        Node* block = new Node(BLOCK);
        while (pos + 1 < tokens.size() && tokens[pos].value == ">>") {
            pos++; // consume '>>'
            std::string var = tokens[pos++].value;
            block->children.push_back(new Node(CIN_NODE, var));
        }
        if (pos < tokens.size() && tokens[pos].value == ";") pos++;
        return block;
    }

    if (tokens[pos].type == T_IDENTIFIER && pos + 1 < tokens.size() && tokens[pos+1].value == "=") {
        std::string var = tokens[pos].value;
        pos += 2;

        Node* expr = parseExpression();

        if (pos < tokens.size() && tokens[pos].value == ";") pos++; // consume ';'

        Node* node = new Node(ASSIGN, var);
        node->children.push_back(expr);
        return node;
    }

    // Safety: Skip unknown tokens to prevent infinite loops
    Node* expr = parseExpression();
    if (expr->type == NUMBER_NODE && expr->value == "0" && pos < tokens.size()) {
       pos++; // Force progress if we couldn't parse anything meaningful
    }

    if (pos < tokens.size() && tokens[pos].value == ";") pos++; // consume ';'
    return expr;
}

Node* Parser::parseIfStatement() {
    pos++; // consume 'if'
    if (pos < tokens.size() && tokens[pos].value == "(") pos++;
    Node* condition = parseExpression();
    if (pos < tokens.size() && tokens[pos].value == ")") pos++;

    Node* block = parseBlock();

    Node* node = new Node(IF_NODE);
    node->children.push_back(condition);
    node->children.push_back(block);
    return node;
}

Node* Parser::parseWhileStatement() {
    pos++; // consume 'while'
    if (pos < tokens.size() && tokens[pos].value == "(") pos++;
    Node* condition = parseExpression();
    if (pos < tokens.size() && tokens[pos].value == ")") pos++;

    Node* block = parseBlock();

    Node* node = new Node(WHILE_NODE);
    node->children.push_back(condition);
    node->children.push_back(block);
    return node;
}

Node* Parser::parseForStatement() {
    pos++; // consume 'for'
    if (pos < tokens.size() && tokens[pos].value == "(") pos++;

    Node* init = parseStatement(); // consumes ';' too
    Node* condition = parseExpression();
    if (pos < tokens.size() && tokens[pos].value == ";") pos++;

    Node* step = nullptr;
    if (pos < tokens.size() && tokens[pos].type == T_IDENTIFIER && pos + 1 < tokens.size() && tokens[pos+1].value == "=") {
        std::string var = tokens[pos].value;
        pos += 2;
        Node* step_expr = parseExpression();
        step = new Node(ASSIGN, var);
        step->children.push_back(step_expr);
    }
    if (pos < tokens.size() && tokens[pos].value == ")") pos++;

    Node* block = parseBlock();

    Node* node = new Node(FOR_NODE);
    node->children.push_back(init);
    node->children.push_back(condition);
    if (step) node->children.push_back(step);
    node->children.push_back(block);
    
    return node;
}

Node* Parser::parseExpression() {
    Node* left = parseAddSub();

    while (pos < tokens.size() && (
        tokens[pos].value == "<" || tokens[pos].value == ">" ||
        tokens[pos].value == "==" || tokens[pos].value == "<=" ||
        tokens[pos].value == ">=" || tokens[pos].value == "!=")) {

        std::string op = tokens[pos++].value;
        Node* right = parseAddSub();

        Node* node = new Node(BINARY, op);
        node->children = {left, right};

        left = node;
    }

    return left;
}

Node* Parser::parseAddSub() {
    Node* left = parseTerm();

    while (pos < tokens.size() &&
          (tokens[pos].value == "+" || tokens[pos].value == "-")) {

        std::string op = tokens[pos++].value;
        Node* right = parseTerm();

        Node* node = new Node(BINARY, op);
        node->children = {left, right};

        left = node;
    }

    return left;
}

Node* Parser::parseTerm() {
    Node* left = parseFactor();

    while (pos < tokens.size() &&
          (tokens[pos].value == "*" || tokens[pos].value == "/")) {

        std::string op = tokens[pos++].value;
        Node* right = parseFactor();

        Node* node = new Node(BINARY, op);
        node->children = {left, right};

        left = node;
    }

    return left;
}

Node* Parser::parseFactor() {
    if (pos >= tokens.size()) return new Node(NUMBER_NODE, "0");

    Token t = tokens[pos++];

    if (t.type == T_NUMBER)
        return new Node(NUMBER_NODE, t.value);

    if (t.type == T_IDENTIFIER)
        return new Node(VAR, t.value);
        
    if (t.value == "(") {
        Node* expr = parseExpression();
        if (pos < tokens.size() && tokens[pos].value == ")") pos++;
        return expr;
    }

    return new Node(NUMBER_NODE, "0");
}