#ifndef TOKEN_H
#define TOKEN_H

#include <string>

enum TokenKind {
    T_IDENTIFIER,
    T_NUMBER,
    T_OPERATOR,
    T_KEYWORD,
    T_SYMBOL
};

struct Token {
    TokenKind type;
    std::string value;
};

#endif